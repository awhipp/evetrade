const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate() + date.getHours();

// Disable cookies for this site entirely
document.cookie = "cookieconsent_status=deny; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";

(function() {
    const originalCookieProperty = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') || Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
/*    if (originalCookieProperty && originalCookieProperty.configurable) {
        Object.defineProperty(document, 'cookie', {
            get: function() {
                return ''; // Return empty string for cookie reads
            },
            set: function(value) {} // No-op for cookie writes
        });
    }*/
})();*
