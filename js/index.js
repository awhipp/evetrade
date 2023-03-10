const container = document.getElementById("announcements");

fetch("announcements.json")
  .then(response => response.json())
  .then(data => {
    const timeLimit = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
    data.announcements.forEach(announcement => {
        const announcementDate = new Date(announcement.date);
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
            announcementDateEl.innerText = announcementDate.toLocaleDateString('en-US', { dateStyle: 'long' });
            const lineContentEl = document.createElement("hr");
            const announcementContentElUl = document.createElement("ul");
            announcementContentElUl.classList.add("announcement-content");
            for (let i = 0; i < announcement.content.length; i++) {
                const announcementContentElLi = document.createElement("li");
                announcementContentElLi.innerText = announcement.content[i];
                announcementContentElUl.appendChild(announcementContentElLi);
            }
            announcementEl.appendChild(announcementHeaderEl);
            announcementEl.appendChild(announcementDateEl);
            announcementEl.appendChild(lineContentEl);
            announcementEl.appendChild(announcementContentElUl);
            container.appendChild(announcementEl);
        }
    });
  });
