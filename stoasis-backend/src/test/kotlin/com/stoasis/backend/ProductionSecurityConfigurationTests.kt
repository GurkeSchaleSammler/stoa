package com.stoasis.backend

import org.hamcrest.Matchers.`is`
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest(
    properties = [
        "spring.datasource.url=jdbc:h2:mem:stoasis-prod-security;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "stoasis.upload.directory=build/test-prod-uploads",
    ],
)
@ActiveProfiles("prod")
@AutoConfigureMockMvc
class ProductionSecurityConfigurationTests {
    @Autowired
    private lateinit var mvc: MockMvc

    @Test
    fun `production security chain starts and fails closed without request provenance`() {
        mvc.post("/api/collections") {
            session = MockHttpSession()
            contentType = MediaType.APPLICATION_JSON
            content = """{"name":"Blocked","emoji":"","allowedTypes":["note"]}"""
        }.andExpect {
            status { isForbidden() }
            jsonPath("$.code", `is`("security.origin_rejected"))
        }
    }
}
