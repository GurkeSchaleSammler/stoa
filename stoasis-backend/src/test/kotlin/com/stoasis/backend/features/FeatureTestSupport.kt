package com.stoasis.backend.features

import com.stoasis.backend.domains.auth.data.UserEntity
import com.stoasis.backend.domains.auth.data.UserRepository
import com.stoasis.backend.domains.collection.api.CreateCollectionRequest
import com.stoasis.backend.domains.collection.application.CollectionService
import com.stoasis.backend.domains.collection.data.CollectionRepository
import com.stoasis.backend.domains.collection.model.PinType
import com.stoasis.backend.domains.pin.data.PinRepository
import com.stoasis.backend.shared.security.SESSION_USER_ID
import java.util.UUID
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.mock.web.MockHttpSession
import org.springframework.test.web.servlet.MockMvc
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

/** Supplies isolated users and boards for API-level feature tests. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
abstract class FeatureTestSupport {
    @Autowired protected lateinit var mvc: MockMvc
    @Autowired protected lateinit var users: UserRepository
    @Autowired protected lateinit var collections: CollectionService
    @Autowired protected lateinit var boards: CollectionRepository
    @Autowired protected lateinit var pins: PinRepository
    @Autowired protected lateinit var mapper: ObjectMapper

    protected fun user(plan: String = "free"): UserEntity {
        val id = "user-${UUID.randomUUID()}"
        return users.saveAndFlush(UserEntity(id = id, email = "$id@example.com", name = "Feature User", plan = plan))
    }

    protected fun sessionFor(user: UserEntity) = MockHttpSession().also { it.setAttribute(SESSION_USER_ID, user.id) }

    protected fun board(user: UserEntity, name: String = "Test board") = collections.create(
        user.id,
        CreateCollectionRequest(name, "📌", setOf(PinType.link, PinType.note, PinType.photo, PinType.portal)),
    ).id

    protected fun json(value: String): JsonNode = mapper.readTree(value)
}
