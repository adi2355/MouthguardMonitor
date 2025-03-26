abstract class Service {
    abstract getInstance(): Service
    abstract cleanup(): void
}