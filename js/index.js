function set_announcement(){
    fetch("announcements.json")
    .then(response => response.json())
    .then(data => {
        if (!data.disabled) {
            data.announcements.forEach(announcement => {
                const announcementEl = document.createElement("div");
                announcementEl.classList.add("announcement");
                const announcementHeaderEl = document.createElement("h2");
                announcementHeaderEl.classList.add("announcement-header");
                announcementHeaderEl.innerHTML = announcement.header;
                
                announcementEl.appendChild(announcementHeaderEl);
                document.getElementById("announcements").appendChild(announcementEl);
            });
        }
    });
    
}