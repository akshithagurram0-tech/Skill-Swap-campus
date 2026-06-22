let students = JSON.parse(localStorage.getItem("students")) || [];

displayStudents();
findMatches();

function addStudent() {

    const name = document.getElementById("name").value.trim();

    const haveSkills = document.getElementById("haveSkills")
        .value
        .split(",")
        .map(skill => skill.trim().toLowerCase());

    const wantSkills = document.getElementById("wantSkills")
        .value
        .split(",")
        .map(skill => skill.trim().toLowerCase());

    if (!name) {
        alert("Enter student name");
        return;
    }

    students.push({
        name,
        haveSkills,
        wantSkills
    });

    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );

    document.getElementById("name").value = "";
    document.getElementById("haveSkills").value = "";
    document.getElementById("wantSkills").value = "";

    displayStudents();
    findMatches();
}

function displayStudents() {

    const list = document.getElementById("studentList");

    list.innerHTML = "";

    students.forEach(student => {

        list.innerHTML += `
            <div class="student-card">
                <h3>${student.name}</h3>
                <p><b>Has:</b> ${student.haveSkills.join(", ")}</p>
                <p><b>Wants:</b> ${student.wantSkills.join(", ")}</p>
            </div>
        `;
    });
}

function findMatches() {

    const matchBox = document.getElementById("matches");

    matchBox.innerHTML = "";

    for(let i=0;i<students.length;i++){

        for(let j=i+1;j<students.length;j++){

            const student1 = students[i];
            const student2 = students[j];

            const match1 = student1.wantSkills.some(skill =>
                student2.haveSkills.includes(skill)
            );

            const match2 = student2.wantSkills.some(skill =>
                student1.haveSkills.includes(skill)
            );

            if(match1 && match2){

                matchBox.innerHTML += `
                    <div class="match-card">
                        🤝 <b>${student1.name}</b> and
                        <b>${student2.name}</b>
                        can exchange skills!
                    </div>
                `;
            }
        }
    }
}