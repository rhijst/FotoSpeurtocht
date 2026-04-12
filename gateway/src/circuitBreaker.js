const CircuitBreaker = require('opossum');

// Circuit breaker instellingen per service
const CB_OPTIONS = {
  timeout: 5000,                  // Request wordt als mislukt beschouwd na 5s
  errorThresholdPercentage: 50,   // Circuit opent na 50% mislukte requests
  resetTimeout: 10000,            // Na 10s gaat circuit naar HALF-OPEN om opnieuw te testen
  volumeThreshold: 3,             // Minimaal 3 requests nodig voordat statistiek geldt
};

/**
 * Maakt een circuit breaker aan voor een microservice.
 * De "probe" doet een kleine fetch naar de service om bereikbaarheid te testen.
 * fetch() gooit alleen een fout bij netwerkproblemen (ECONNREFUSED, timeout),
 * niet bij HTTP-foutcodes — dus elke HTTP-response betekent: service is online.
 */
function createServiceBreaker(serviceName, serviceUrl) {
  const probe = () => fetch(serviceUrl, { signal: AbortSignal.timeout(3000) });

  const breaker = new CircuitBreaker(probe, CB_OPTIONS);

  breaker.on('open', () =>
    console.warn(`[CircuitBreaker] OPEN     → ${serviceName} is niet bereikbaar`)
  );
  breaker.on('halfOpen', () =>
    console.log(`[CircuitBreaker] HALF-OPEN → ${serviceName} — verbinding testen...`)
  );
  breaker.on('close', () =>
    console.log(`[CircuitBreaker] GESLOTEN → ${serviceName} is weer online`)
  );

  return breaker;
}

/**
 * Express middleware die de circuit breaker controleert vóór elke proxied request.
 * - Circuit CLOSED: request gaat door naar de service
 * - Circuit OPEN/HALF-OPEN: direct 503 terugsturen, service niet aanspreken
 */
function circuitBreakerGuard(breaker, serviceName) {
  return async (req, res, next) => {
    try {
      await breaker.fire();
      next();
    } catch {
      const state = breaker.opened ? 'OPEN' : 'HALF-OPEN';
      console.error(
        `[CircuitBreaker] Request geblokkeerd naar ${serviceName} — circuit is ${state}`
      );
      res.status(503).json({
        error: 'Service tijdelijk niet beschikbaar. Probeer het later opnieuw.',
        service: serviceName,
        circuitState: state,
      });
    }
  };
}

module.exports = { createServiceBreaker, circuitBreakerGuard };
