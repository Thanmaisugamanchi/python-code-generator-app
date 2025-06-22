// Cache name - update this whenever you make changes to your app's assets
const CACHE_NAME = 'python-code-generator-v1';

// List of URLs to cache
const urlsToCache = [
    '/', // Caches the index.html
    'index.html', // Explicitly cache index.html
    'https://cdn.tailwindcss.com', // Cache the Tailwind CSS CDN
    // Add any other CSS, JS files, or images your app uses
];

// Install event: Caches all the necessary assets when the service worker is installed
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Failed to cache assets during install:', error);
            })
    );
});

// Fetch event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests, and don't try to cache API calls
    if (event.request.method === 'GET' && !event.request.url.includes('generativelanguage.googleapis.com')) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }
                    // No cache hit - fetch from network
                    return fetch(event.request).then(
                        (response) => {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // IMPORTANT: Clone the response. A response is a stream
                            // and can only be consumed once. We consume it once to cache it,
                            // and once the browser consumes it.
                            const responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        }
                    );
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                    // You could serve a fallback page here if offline and nothing is in cache
                    // return caches.match('/offline.html'); // Example
                })
        );
    }
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        // Delete old caches
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
