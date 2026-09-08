FROM eclipse-temurin:25-jdk-alpine AS build

WORKDIR /workspace
COPY gradle gradle
COPY gradlew build.gradle.kts settings.gradle.kts ./
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies --configuration runtimeClasspath >/dev/null
COPY src src
RUN ./gradlew --no-daemon bootJar

FROM eclipse-temurin:25-jre-alpine

RUN addgroup -S stoasis && adduser -S stoasis -G stoasis
WORKDIR /app
COPY --from=build /workspace/build/libs/stoasis.jar /app/stoasis.jar
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN mkdir -p /data/uploads && chmod +x /app/entrypoint.sh && chown -R stoasis:stoasis /app /data/uploads

USER stoasis
EXPOSE 4000
ENTRYPOINT ["/app/entrypoint.sh"]
