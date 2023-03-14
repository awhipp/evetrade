function set_announcement(version_data){
    fetch("announcements.json")
    .then(response => response.json())
    .then(data => {
        if (!data.disabled) {
            const timeLimit = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
            data.announcements.forEach(announcement => {
                const announcementDate = version_data == 'XX-XX-XXXX' ? new Date() : new Date(version_data);
                const timeDiff = new Date().getTime() - announcementDate.getTime();
                if (timeDiff < timeLimit) {
                    const announcementEl = document.createElement("div");
                    announcementEl.classList.add("announcement");
                    if (timeDiff < 0) {
                        announcementEl.classList.add("past");
                    }
                    const announcementHeaderEl = document.createElement("h2");
                    announcementHeaderEl.classList.add("announcement-header");
                    announcementHeaderEl.innerText = announcement.header;
                    const announcementDateEl = document.createElement("div");
                    announcementDateEl.classList.add("announcement-date");
                    announcementDateEl.innerText = announcementDate.toLocaleDateString();
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
                        announcementContentElLi.innerText = announcement.content[i];
                        announcementContentElUl.appendChild(announcementContentElLi);
                    }
                    announcementContentElDiv.appendChild(announcementContentElUl);

                    const announcementContentElP2 = document.createElement("p");
                    announcementContentElP2.classList.add("announcement-header");
                    announcementContentElP2.innerText = 'Known Issues:';
                    announcementContentElDiv.appendChild(announcementContentElP2);

                    const announcementContentElUl2 = document.createElement("ul");
                    announcementContentElUl2.classList.add("announcement-content");
                    for (let i = 0; i < announcement.known_issues.length; i++) {
                        const announcementContentElLi = document.createElement("li");
                        announcementContentElLi.innerText = announcement.known_issues[i];
                        announcementContentElUl2.appendChild(announcementContentElLi);
                    }
                    announcementContentElDiv.appendChild(announcementContentElUl2);


                    announcementEl.appendChild(announcementHeaderEl);
                    announcementEl.appendChild(announcementDateEl);
                    announcementEl.appendChild(lineContentEl);
                    announcementEl.appendChild(announcementContentElDiv);
                    document.getElementById("announcements").appendChild(announcementEl);
                }
            });
        }
    });
  
}