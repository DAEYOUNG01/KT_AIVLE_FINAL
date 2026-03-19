# -------- Build stage --------
FROM gradle:8.10.2-jdk17 AS builder
WORKDIR /app

# 캐시 최적화: 의존성 먼저 받기
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon || true

# 소스 복사 후 빌드
COPY src src
RUN ./gradlew clean bootJar -x test --no-daemon

# -------- Run stage --------
FROM eclipse-temurin:17-jre
WORKDIR /app

# 빌드된 jar 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

# 환경변수로 DB 등 설정 주입하는 전제
ENTRYPOINT ["java","-jar","app.jar"]