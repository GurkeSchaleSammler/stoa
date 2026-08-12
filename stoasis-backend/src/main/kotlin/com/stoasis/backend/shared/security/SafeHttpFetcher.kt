package com.stoasis.backend.shared.security

import com.stoasis.backend.shared.web.ApiException
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.ByteArrayOutputStream
import java.net.IDN
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import java.net.URI
import java.nio.charset.StandardCharsets
import javax.net.ssl.SNIHostName
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component

data class SafeHttpResponse(
    val uri: URI,
    val status: Int,
    val headers: Map<String, String>,
    val body: ByteArray,
)

/**
 * Fetches public HTTP resources without delegating DNS resolution to a second connection layer.
 * The validated public IP is the exact address used by the socket, which closes the common
 * DNS-rebinding gap between validation and connection. Redirect targets are validated separately.
 */
@Component
class SafeHttpFetcher {
    fun get(rawUrl: String, accept: String, maxBytes: Int): SafeHttpResponse =
        get(PublicUrlPolicy.parse(rawUrl), accept, maxBytes)

    fun get(initialUri: URI, accept: String, maxBytes: Int): SafeHttpResponse {
        var uri = PublicUrlPolicy.validate(initialUri)
        repeat(MAX_REDIRECTS + 1) { redirectCount ->
            val response = request(uri, accept, maxBytes)
            if (response.status !in REDIRECT_STATUSES) return response
            if (redirectCount == MAX_REDIRECTS) {
                throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Zu viele Weiterleitungen.")
            }
            val location = response.headers["location"]
                ?: throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Ungültige Weiterleitung.")
            uri = try {
                PublicUrlPolicy.validate(uri.resolve(location))
            } catch (exception: ApiException) {
                throw exception
            } catch (_: Exception) {
                throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Ungültige Weiterleitung.")
            }
        }
        error("unreachable")
    }

    private fun request(uri: URI, accept: String, maxBytes: Int): SafeHttpResponse {
        val host = IDN.toASCII(uri.host, IDN.USE_STD3_ASCII_RULES).lowercase()
        val addresses = PublicUrlPolicy.resolvePublic(host)
        var lastFailure: Exception? = null

        for (address in addresses) {
            try {
                return openSocket(uri, host, address).use { socket ->
                    writeRequest(socket, uri, host, accept)
                    readResponse(socket, uri, maxBytes)
                }
            } catch (exception: Exception) {
                lastFailure = exception
            }
        }
        throw ApiException(
            HttpStatus.UNPROCESSABLE_ENTITY,
            "Die externe Seite ist nicht erreichbar.",
            lastFailure,
        )
    }

    private fun openSocket(uri: URI, host: String, address: InetAddress): Socket {
        val port = uri.port.takeIf { it >= 0 } ?: if (uri.scheme == "https") 443 else 80
        val rawSocket = Socket()
        rawSocket.connect(InetSocketAddress(address, port), CONNECT_TIMEOUT_MS)
        rawSocket.soTimeout = READ_TIMEOUT_MS
        if (uri.scheme == "http") return rawSocket

        val sslSocket = (SSLSocketFactory.getDefault() as SSLSocketFactory)
            .createSocket(rawSocket, host, port, true) as SSLSocket
        sslSocket.sslParameters = sslSocket.sslParameters.apply {
            endpointIdentificationAlgorithm = "HTTPS"
            serverNames = listOf(SNIHostName(host))
        }
        sslSocket.startHandshake()
        return sslSocket
    }

    private fun writeRequest(socket: Socket, uri: URI, host: String, accept: String) {
        val target = buildString {
            append(uri.rawPath?.takeIf(String::isNotEmpty) ?: "/")
            uri.rawQuery?.let { append('?').append(it) }
        }
        if ('\r' in target || '\n' in target) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Ungültige URL.")
        }
        val request = buildString {
            append("GET ").append(target).append(" HTTP/1.1\r\n")
            append("Host: ").append(host).append("\r\n")
            append("User-Agent: StoasisPreview/1.0 (+https://stoasis.local)\r\n")
            append("Accept: ").append(accept).append("\r\n")
            append("Accept-Encoding: identity\r\n")
            append("Connection: close\r\n\r\n")
        }
        BufferedOutputStream(socket.getOutputStream()).apply {
            write(request.toByteArray(StandardCharsets.ISO_8859_1))
            flush()
        }
    }

    private fun readResponse(socket: Socket, uri: URI, maxBytes: Int): SafeHttpResponse {
        val input = BufferedInputStream(socket.getInputStream())
        val statusLine = readLine(input, MAX_HEADER_LINE)
        val status = statusLine.split(' ').getOrNull(1)?.toIntOrNull()
            ?: throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Ungültige HTTP-Antwort.")
        val headers = linkedMapOf<String, String>()
        var headerBytes = statusLine.length
        while (true) {
            val line = readLine(input, MAX_HEADER_LINE)
            headerBytes += line.length
            if (headerBytes > MAX_HEADERS_BYTES) {
                throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Zu grosse HTTP-Header.")
            }
            if (line.isEmpty()) break
            val separator = line.indexOf(':')
            if (separator <= 0) continue
            headers[line.substring(0, separator).trim().lowercase()] = line.substring(separator + 1).trim()
        }
        val contentEncoding = headers["content-encoding"]?.lowercase()
        if (contentEncoding != null && contentEncoding != "identity") {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Komprimierte Vorschauen werden nicht verarbeitet.")
        }
        val body = when {
            status in REDIRECT_STATUSES -> byteArrayOf()
            headers["transfer-encoding"]?.lowercase()?.contains("chunked") == true ->
                readChunked(input, maxBytes)
            else -> readBody(input, headers["content-length"]?.toLongOrNull(), maxBytes)
        }
        return SafeHttpResponse(uri, status, headers, body)
    }

    private fun readChunked(input: BufferedInputStream, maxBytes: Int): ByteArray {
        val output = ByteArrayOutputStream()
        while (true) {
            val size = readLine(input, 128).substringBefore(';').trim().toIntOrNull(16)
                ?: throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Ungültige Chunk-Antwort.")
            if (size == 0) break
            if (output.size() + size > maxBytes) tooLarge()
            copyExact(input, output, size)
            if (readLine(input, 2).isNotEmpty()) {
                throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Ungültige Chunk-Antwort.")
            }
        }
        return output.toByteArray()
    }

    private fun readBody(input: BufferedInputStream, contentLength: Long?, maxBytes: Int): ByteArray {
        if (contentLength != null && contentLength > maxBytes) tooLarge()
        val output = ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            if (output.size() + count > maxBytes) tooLarge()
            output.write(buffer, 0, count)
        }
        return output.toByteArray()
    }

    private fun copyExact(input: BufferedInputStream, output: ByteArrayOutputStream, size: Int) {
        var remaining = size
        val buffer = ByteArray(8192)
        while (remaining > 0) {
            val count = input.read(buffer, 0, minOf(buffer.size, remaining))
            if (count < 0) throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Unvollständige HTTP-Antwort.")
            output.write(buffer, 0, count)
            remaining -= count
        }
    }

    private fun readLine(input: BufferedInputStream, maxLength: Int): String {
        val output = ByteArrayOutputStream()
        while (output.size() <= maxLength) {
            val value = input.read()
            if (value < 0) throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Unvollständige HTTP-Antwort.")
            if (value == '\n'.code) break
            if (value != '\r'.code) output.write(value)
        }
        if (output.size() > maxLength) {
            throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Zu lange HTTP-Headerzeile.")
        }
        return output.toString(StandardCharsets.ISO_8859_1)
    }

    private fun tooLarge(): Nothing =
        throw ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Die externe Ressource ist zu gross.")

    companion object {
        private const val CONNECT_TIMEOUT_MS = 4_000
        private const val READ_TIMEOUT_MS = 6_000
        private const val MAX_REDIRECTS = 3
        private const val MAX_HEADER_LINE = 8_192
        private const val MAX_HEADERS_BYTES = 64 * 1_024
        private val REDIRECT_STATUSES = setOf(301, 302, 303, 307, 308)
    }
}

object PublicUrlPolicy {
    fun parse(rawUrl: String): URI = try {
        validate(URI(rawUrl.trim()))
    } catch (exception: ApiException) {
        throw exception
    } catch (_: Exception) {
        throw ApiException(HttpStatus.BAD_REQUEST, "Bitte eine vollständige öffentliche URL eingeben.")
    }

    fun validate(uri: URI): URI {
        if (uri.scheme?.lowercase() !in setOf("http", "https") || uri.host.isNullOrBlank()) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Nur öffentliche HTTP- und HTTPS-URLs sind erlaubt.")
        }
        if (uri.userInfo != null) throw ApiException(HttpStatus.BAD_REQUEST, "URLs mit Zugangsdaten sind nicht erlaubt.")
        val port = uri.port
        val expectedPort = if (uri.scheme.equals("https", ignoreCase = true)) 443 else 80
        if (port != -1 && port != expectedPort) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Nur die Standardports 80 und 443 sind erlaubt.")
        }
        val host = IDN.toASCII(uri.host, IDN.USE_STD3_ASCII_RULES).lowercase()
        if (host == "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Lokale Zieladressen sind nicht erlaubt.")
        }
        resolvePublic(host)
        return URI(uri.scheme.lowercase(), null, host, port, uri.path?.ifEmpty { "/" } ?: "/", uri.query, null)
    }

    fun resolvePublic(host: String): List<InetAddress> {
        val addresses = runCatching { InetAddress.getAllByName(host).toList() }.getOrElse {
            throw ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "Der Domainname konnte nicht aufgelöst werden.")
        }
        if (addresses.isEmpty() || addresses.any { !isPublic(it) }) {
            throw ApiException(HttpStatus.BAD_REQUEST, "Die URL verweist nicht ausschliesslich auf öffentliche Adressen.")
        }
        return addresses
    }

    internal fun isPublic(address: InetAddress): Boolean {
        if (address.isAnyLocalAddress || address.isLoopbackAddress || address.isLinkLocalAddress ||
            address.isSiteLocalAddress || address.isMulticastAddress
        ) return false
        return when (address) {
            is Inet4Address -> isPublicIpv4(address.address)
            is Inet6Address -> isPublicIpv6(address.address)
            else -> false
        }
    }

    private fun isPublicIpv4(bytes: ByteArray): Boolean {
        val a = bytes[0].toInt() and 0xff
        val b = bytes[1].toInt() and 0xff
        val c = bytes[2].toInt() and 0xff
        return when {
            a == 0 || a == 10 || a == 127 || a >= 224 -> false
            a == 100 && b in 64..127 -> false
            a == 169 && b == 254 -> false
            a == 172 && b in 16..31 -> false
            a == 192 && b == 168 -> false
            a == 192 && b == 0 && c in setOf(0, 2) -> false
            a == 198 && b in setOf(18, 19) -> false
            a == 198 && b == 51 && c == 100 -> false
            a == 203 && b == 0 && c == 113 -> false
            else -> true
        }
    }

    private fun isPublicIpv6(bytes: ByteArray): Boolean {
        val first = bytes[0].toInt() and 0xff
        val second = bytes[1].toInt() and 0xff
        if (bytes.all { it == 0.toByte() }) return false
        if (first == 0x00 && second == 0x64 && bytes[2] == 0xff.toByte() && bytes[3] == 0x9b.toByte() &&
            (bytes.sliceArray(4..11).all { it == 0.toByte() } ||
                (bytes[4] == 0.toByte() && bytes[5] == 1.toByte()))
        ) return false // RFC 6052/8215 IPv4 translation ranges
        if (first == 0x01 && second == 0x00 && bytes.sliceArray(2..7).all { it == 0.toByte() }) return false
        if (first and 0xfe == 0xfc) return false // fc00::/7
        if (first == 0xfe && second and 0xc0 == 0x80) return false // fe80::/10
        if (first == 0xff) return false
        if (first == 0x20 && second == 0x01 && bytes[2] == 0.toByte() && bytes[3] == 0.toByte()) return false
        if (first == 0x20 && second == 0x01 && bytes[2] == 0x0d.toByte() && bytes[3] == 0xb8.toByte()) return false
        if (first == 0x20 && second == 0x02) return false // 6to4 can tunnel non-public IPv4 targets
        return true
    }
}
