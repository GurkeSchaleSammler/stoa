package com.stoasis.backend.shared.utils

import com.stoasis.backend.shared.web.ApiException
import java.net.IDN
import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.net.URI
import org.springframework.http.HttpStatus

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

