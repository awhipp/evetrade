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
                const lineContentEl = document.createElement("hr");
                
                const announcementContentElDiv = document.createElement("div");
                
                const announcementContentElP = document.createElement("p");
                announcementContentElP.classList.add("announcement-header");
                announcementContentElP.innerText = 'Release Notes';
                announcementContentElDiv.appendChild(announcementContentElP);
                
                const announcementContentElUl = document.createElement("ul");
                announcementContentElUl.classList.add("announcement-content");
                for (let i = 0; i < announcement.content.length; i++) {
                    const announcementContentElLi = document.createElement("li");
                    announcementContentElLi.innerHTML = announcement.content[i];
                    announcementContentElUl.appendChild(announcementContentElLi);
                }
                announcementContentElDiv.appendChild(announcementContentElUl);
                
                const announcementContentElP2 = document.createElement("p");
                announcementContentElP2.classList.add("announcement-header");
                if (announcement.known_issues.length > 0) {
                    announcementContentElP2.innerText = 'Known Issues:';
                    announcementContentElDiv.appendChild(announcementContentElP2);
                    
                    const announcementContentElUl2 = document.createElement("ul");
                    announcementContentElUl2.classList.add("announcement-content");
                    for (let i = 0; i < announcement.known_issues.length; i++) {
                        const announcementContentElLi = document.createElement("li");
                        announcementContentElLi.innerHTML = announcement.known_issues[i];
                        announcementContentElUl2.appendChild(announcementContentElLi);
                    }
                    announcementContentElDiv.appendChild(announcementContentElUl2);
                }
                
                
                announcementEl.appendChild(announcementHeaderEl);
                announcementEl.appendChild(lineContentEl);
                announcementEl.appendChild(announcementContentElDiv);
                document.getElementById("announcements").appendChild(announcementEl);
            });
        }
    });
    
}