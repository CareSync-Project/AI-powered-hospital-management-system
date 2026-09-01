# Patient PWA Plan

## Scope and timing

The patient experience will become a PWA in Phase 5. Phase 1 adds this plan only; it does not register a service worker or claim installability/offline support.

## Planned architecture

- Keep the patient interface inside the shared React client and expose mobile-first patient routes/layouts.
- Add a standards-based Web App Manifest with application name, short name, theme/background colors, display mode, start URL, and appropriately scoped application identity.
- Provide purpose-designed icons, including maskable variants, at required sizes and validate them.
- Use a Vite-compatible, versioned service worker to cache only the public application shell and non-sensitive static assets.
- Offer install guidance only when platform criteria are met; the browser experience must remain usable without installation.
- Add responsive patient cards/forms and accessible mobile bottom navigation for primary patient tasks.
- Provide an offline fallback page and a clear offline status indicator.
- Detect stale versions and prompt for controlled refreshes so shell/API versions remain compatible.

## Caching strategy

Eligible for precache or carefully bounded runtime caching:

- Versioned JavaScript/CSS bundles
- Public icons, locally hosted fonts, logos, and generic imagery
- A minimal offline fallback document

Never cache through the service worker:

- Authentication tokens or session responses
- Patient profiles, identifiers, appointments, symptoms, vitals, messages, prescriptions, consultation records, or other health data
- Administrative or clinical API responses
- POST, PATCH, or DELETE requests

Private API calls should use a network-only strategy with explicit error/offline UI. IndexedDB, Cache Storage, and background sync must not hold medical records without a separate reviewed threat model and authorization decision.

## Privacy and security considerations

- Serve only over HTTPS outside local development.
- Keep service-worker scope narrow and version/cache names explicit.
- Minimize data shown in OS notifications and lock-screen surfaces.
- Do not place secrets in the manifest, client bundle, or service worker.
- Define logout/cache cleanup behavior, but never rely on cache deletion as the only privacy control.
- Review token storage, XSS defenses, content security policy, update integrity, device sharing, accessibility, and lost-device risk.
- Clearly communicate when actions require connectivity and never silently queue urgent clinical actions.
- Offline content must direct emergencies to appropriate real-world services rather than simulate clinical availability.

## Validation plan for Phase 5

- Manifest and icon validation in supported browsers
- Install/uninstall and update testing on representative Android, iOS, and desktop environments
- Responsive and accessibility testing for bottom navigation and forms
- Offline-shell testing with private API cache inspection
- Verification that logout and version upgrades do not expose stale private content
