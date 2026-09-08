import {
  auth,
  db
} from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let students = [];

let districts = [];
let taluks = [];
let villages = [];
let schools = [];
let courses = [];

let editingId = null;
let deleteId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
  document.getElementById("pageLoader");

const studentModal =
  document.getElementById("studentModal");

const deleteModal =
  document.getElementById("deleteModal");

const studentForm =
  document.getElementById("studentForm");

const tableBody =
  document.getElementById("studentTableBody");

const searchInput =
  document.getElementById("searchInput");

const classFilter =
  document.getElementById("classFilter");

const statusFilter =
  document.getElementById("statusFilter");

const districtSelect =
  document.getElementById("districtSelect");

const talukSelect =
  document.getElementById("talukSelect");

const villageSelect =
  document.getElementById("villageSelect");

const schoolSelect =
  document.getElementById("schoolSelect");

const courseSelect =
  document.getElementById("courseSelect");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
  auth,
  (user) => {

    if (!user) {

      window.location.href =
        "../../index.html";

      return;

    }

    currentUser = user;

    startListeners();

  }
);


/* =========================================================
   START REALTIME LISTENERS
========================================================= */

function startListeners() {

  listenToCollection(
    "crmDistricts",
    (data) => {

      districts = data;

      populateDistricts();

    }
  );


  listenToCollection(
    "crmTaluks",
    (data) => {

      taluks = data;

      updateTalukDropdown();

    }
  );


  listenToCollection(
    "crmVillages",
    (data) => {

      villages = data;

      updateVillageDropdown();

    }
  );


  listenToCollection(
    "crmSchools",
    (data) => {

      schools = data;

      updateSchoolDropdown();

      renderStudents();

    }
  );


  listenToCollection(
    "crmCourses",
    (data) => {

      courses = data;

      updateCourseDropdown();

      renderStudents();

    }
  );


  listenToCollection(
    "crmStudents",
    (data) => {

      students = data;

      students.sort(
        sortByName
      );

      renderStudents();

      updateStats();

      hideLoader();

    }
  );

}


/* =========================================================
   GENERIC REALTIME COLLECTION
========================================================= */

function listenToCollection(
  collectionName,
  callback
) {

  const ref =
    collection(
      db,
      collectionName
    );


  /*
   * No orderBy dependency here.
   * This keeps the CRM from requiring
   * Firestore composite indexes.
   */

  onSnapshot(
    ref,

    (snapshot) => {

      const result = [];

      snapshot.forEach(
        (docSnap) => {

          result.push({
            id: docSnap.id,
            ...docSnap.data()
          });

        }
      );

      callback(result);

    },

    (error) => {

      console.error(
        `${collectionName} listener error:`,
        error
      );

      showToast(
        `Unable to load ${collectionName}.`
      );

    }
  );

}


/* =========================================================
   DISTRICT
========================================================= */

function populateDistricts(
  selectedId = ""
) {

  const activeDistricts =
    districts
      .filter(
        item =>
          item.crmActive !== false
      )
      .sort(
        sortByNameField(
          "crmDistrictName"
        )
      );


  districtSelect.innerHTML = `
    <option value="">
      Select district
    </option>
  `;


  activeDistricts.forEach(
    (district) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        district.id;

      option.textContent =
        district.crmDistrictName ||
        "Unnamed District";

      districtSelect.appendChild(
        option
      );

    }
  );


  if (selectedId) {

    districtSelect.value =
      selectedId;

  }

}


/* =========================================================
   TALUK
========================================================= */

function updateTalukDropdown(
  selectedId = ""
) {

  const districtId =
    districtSelect.value;


  talukSelect.innerHTML = `
    <option value="">
      ${
        districtId
          ? "Select taluk"
          : "Select district first"
      }
    </option>
  `;


  talukSelect.disabled =
    !districtId;


  villageSelect.innerHTML = `
    <option value="">
      Select taluk first
    </option>
  `;

  villageSelect.disabled = true;


  schoolSelect.innerHTML = `
    <option value="">
      Select taluk first
    </option>
  `;

  schoolSelect.disabled = true;


  if (!districtId) {

    return;

  }


  const activeTaluks =
    taluks
      .filter(
        taluk =>

          taluk.crmActive !== false &&

          taluk.crmDistrictId ===
          districtId

      )
      .sort(
        sortByNameField(
          "crmTalukName"
        )
      );


  activeTaluks.forEach(
    (taluk) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        taluk.id;

      option.textContent =
        taluk.crmTalukName ||
        "Unnamed Taluk";

      talukSelect.appendChild(
        option
      );

    }
  );


  if (selectedId) {

    talukSelect.value =
      selectedId;

  }

}


/* =========================================================
   VILLAGE
========================================================= */

function updateVillageDropdown(
  selectedId = ""
) {

  const districtId =
    districtSelect.value;

  const talukId =
    talukSelect.value;


  villageSelect.innerHTML = `
    <option value="">
      ${
        talukId
          ? "Select village"
          : "Select taluk first"
      }
    </option>
  `;


  villageSelect.disabled =
    !talukId;


  if (
    !districtId ||
    !talukId
  ) {

    updateSchoolDropdown();

    return;

  }


  const activeVillages =
    villages
      .filter(
        village =>

          village.crmActive !== false &&

          village.crmDistrictId ===
          districtId &&

          village.crmTalukId ===
          talukId

      )
      .sort(
        sortByNameField(
          "crmVillageName"
        )
      );


  activeVillages.forEach(
    (village) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        village.id;

      option.textContent =
        village.crmVillageName ||
        "Unnamed Village";

      villageSelect.appendChild(
        option
      );

    }
  );


  if (selectedId) {

    villageSelect.value =
      selectedId;

  }


  updateSchoolDropdown();

}


/* =========================================================
   SCHOOL
   IMPORTANT:
   SCHOOL FILTERS BY TALUK
   NOT GP
========================================================= */

function updateSchoolDropdown(
  selectedId = ""
) {

  const talukId =
    talukSelect.value;


  schoolSelect.innerHTML = `
    <option value="">
      ${
        talukId
          ? "Select school"
          : "Select taluk first"
      }
    </option>
  `;


  schoolSelect.disabled =
    !talukId;


  if (!talukId) {

    return;

  }


  const activeSchools =
    schools
      .filter(
        school =>

          school.crmActive !== false &&

          school.crmTalukId ===
          talukId

      )
      .sort(
        sortByNameField(
          "crmSchoolName"
        )
      );


  activeSchools.forEach(
    (school) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        school.id;

      option.textContent =
        school.crmSchoolName ||
        "Unnamed School";

      schoolSelect.appendChild(
        option
      );

    }
  );


  if (selectedId) {

    schoolSelect.value =
      selectedId;

  }

}


/* =========================================================
   COURSE
   FILTER BY CLASS
========================================================= */

function updateCourseDropdown(
  selectedId = ""
) {

  const className =
    document.getElementById(
      "studentClass"
    ).value;


  courseSelect.innerHTML = `
    <option value="">
      ${
        className
          ? "Select course"
          : "Select class first"
      }
    </option>
  `;


  if (!className) {

    return;

  }


  const activeCourses =
    courses
      .filter(
        course =>

          course.crmActive !== false &&

          course.crmClass ===
          className

      )
      .sort(
        sortByNameField(
          "crmCourseName"
        )
      );


  activeCourses.forEach(
    (course) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        course.id;

      option.textContent =
        `${course.crmCourseName || "Unnamed Course"} — ${
          formatCurrency(
            course.crmFinalPrice ??
            course.crmPrice ??
            0
          )
        }`;

      courseSelect.appendChild(
        option
      );

    }
  );


  if (selectedId) {

    courseSelect.value =
      selectedId;

  }


  updateCoursePrice();

}


/* =========================================================
   COURSE PRICE
========================================================= */

function updateCoursePrice() {

  const courseId =
    courseSelect.value;


  const course =
    courses.find(
      item =>
        item.id === courseId
    );


  const price =
    Number(
      course?.crmPrice ?? 0
    );


  const discount =
    Number(
      course?.crmDiscount ?? 0
    );


  const finalPrice =
    Number(
      course?.crmFinalPrice ??
      Math.max(
        0,
        price - discount
      )
    );


  document.getElementById(
    "coursePriceDisplay"
  ).textContent =
    formatCurrency(price);


  document.getElementById(
    "courseDiscountDisplay"
  ).textContent =
    formatCurrency(discount);


  document.getElementById(
    "courseFinalPriceDisplay"
  ).textContent =
    formatCurrency(finalPrice);

}


/* =========================================================
   RENDER STUDENTS
========================================================= */

function renderStudents() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();


  const selectedClass =
    classFilter.value;


  const selectedStatus =
    statusFilter.value;


  const filtered =
    students.filter(
      (student) => {

        const matchesSearch =
          !search ||
          [

            student.crmStudentName,

            student.crmStudentCode,

            student.crmStudentPhone,

            student.crmStudentEmail,

            student.crmSchoolName,

            student.crmVillageName,

            student.crmTalukName,

            student.crmDistrictName,

            student.crmCourseName

          ]
          .some(
            value =>
              String(value || "")
                .toLowerCase()
                .includes(search)
          );


        const matchesClass =
          !selectedClass ||
          student.crmClass ===
          selectedClass;


        const matchesStatus =
          !selectedStatus ||
          student.crmLeadStatus ===
          selectedStatus;


        return (
          matchesSearch &&
          matchesClass &&
          matchesStatus
        );

      }
    );


  document.getElementById(
    "studentCountLabel"
  ).textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "student"
        : "students"
    }`;


  if (!filtered.length) {

    tableBody.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="empty-state"
        >
          ${
            search ||
            selectedClass ||
            selectedStatus
              ? "No students match the selected filters."
              : "No students added yet."
          }
        </td>
      </tr>
    `;

    return;

  }


  tableBody.innerHTML =
    filtered.map(
      (student) => {

        const lead =
          String(
            student.crmLeadTemperature ||
            "COLD"
          ).toLowerCase();


        const status =
          student.crmLeadStatus ||
          "NEW";


        const enrollment =
          student.crmEnrollmentStatus ||
          "NOT ENROLLED";


        return `
          <tr>

            <td>

              <div class="student-name">
                ${escapeHTML(
                  student.crmStudentName ||
                  "Unnamed Student"
                )}
              </div>

              <div class="student-code">
                ${escapeHTML(
                  student.crmStudentCode ||
                  "—"
                )}
              </div>

            </td>


            <td>
              ${escapeHTML(
                student.crmStudentPhone ||
                "—"
              )}
            </td>


            <td>
              ${escapeHTML(
                student.crmClass ||
                "—"
              )}
            </td>


            <td>
              ${escapeHTML(
                student.crmSchoolName ||
                "—"
              )}
            </td>


            <td>

              <div class="location-text">

                ${escapeHTML(
                  student.crmVillageName ||
                  ""
                )}

                ${
                  student.crmTalukName
                    ? `<br>${escapeHTML(
                        student.crmTalukName
                      )}`
                    : ""
                }

              </div>

            </td>


            <td>

              <div class="course-text">
                ${escapeHTML(
                  student.crmCourseName ||
                  "—"
                )}
              </div>

              ${
                student.crmFinalFee != null
                  ? `
                    <div class="course-fee">
                      ${formatCurrency(
                        student.crmFinalFee
                      )}
                    </div>
                  `
                  : ""
              }

            </td>


            <td>

              <span class="badge ${lead}">
                ${escapeHTML(
                  student.crmLeadTemperature ||
                  "COLD"
                )}
              </span>

            </td>


            <td>

              <span class="badge ${
                enrollment === "ENROLLED"
                  ? "enrolled"
                  : "status"
              }">

                ${escapeHTML(
                  enrollment === "ENROLLED"
                    ? "ENROLLED"
                    : status
                )}

              </span>

            </td>


            <td>

              <div class="actions">

                <button
                  class="action-btn"
                  data-action="edit"
                  data-id="${student.id}"
                >
                  Edit
                </button>

                <button
                  class="action-btn delete"
                  data-action="delete"
                  data-id="${student.id}"
                >
                  Delete
                </button>

              </div>

            </td>

          </tr>
        `;

      }
    ).join("");

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  document.getElementById(
    "totalStudents"
  ).textContent =
    students.length;


  document.getElementById(
    "activeStudents"
  ).textContent =
    students.filter(
      student =>
        student.crmActive !== false
    ).length;


  document.getElementById(
    "hotStudents"
  ).textContent =
    students.filter(
      student =>
        String(
          student.crmLeadTemperature ||
          ""
        ).toUpperCase() === "HOT"
    ).length;


  document.getElementById(
    "enrolledStudents"
  ).textContent =
    students.filter(
      student =>
        student.crmEnrollmentStatus ===
        "ENROLLED"
    ).length;

}


/* =========================================================
   OPEN ADD
========================================================= */

function openAddModal() {

  editingId = null;

  document.getElementById(
    "modalTitle"
  ).textContent =
    "Add Student";


  document.getElementById(
    "saveStudentBtn"
  ).textContent =
    "Save Student";


  studentForm.reset();


  document.getElementById(
    "studentActive"
  ).checked = true;


  districtSelect.value = "";

  updateTalukDropdown();


  courseSelect.innerHTML = `
    <option value="">
      Select class first
    </option>
  `;


  resetCoursePrice();


  studentModal.classList.add(
    "show"
  );

}


/* =========================================================
   OPEN EDIT
========================================================= */

function openEditModal(id) {

  const student =
    students.find(
      item =>
        item.id === id
    );


  if (!student) return;


  editingId = id;


  document.getElementById(
    "modalTitle"
  ).textContent =
    "Edit Student";


  document.getElementById(
    "saveStudentBtn"
  ).textContent =
    "Update Student";


  /*
   * Basic
   */

  setValue(
    "studentName",
    student.crmStudentName
  );

  setValue(
    "studentPhone",
    student.crmStudentPhone
  );

  setValue(
    "studentEmail",
    student.crmStudentEmail
  );

  setValue(
    "instagramUrl",
    student.crmInstagramUrl
  );


  /*
   * Parents
   */

  setValue(
    "fatherName",
    student.crmFatherName
  );

  setValue(
    "fatherPhone",
    student.crmFatherPhone
  );

  setValue(
    "motherName",
    student.crmMotherName
  );

  setValue(
    "motherPhone",
    student.crmMotherPhone
  );

  setValue(
    "guardianName",
    student.crmGuardianName
  );

  setValue(
    "primaryContact",
    student.crmPrimaryContact
  );


  /*
   * Academic
   */

  setValue(
    "studentClass",
    student.crmClass
  );

  setValue(
    "studentBoard",
    student.crmBoard
  );

  setValue(
    "studentMedium",
    student.crmMedium
  );

  setValue(
    "currentPercentage",
    student.crmCurrentPercentage
  );

  setValue(
    "targetPercentage",
    student.crmTargetPercentage
  );

  setValue(
    "subjectsToImprove",
    Array.isArray(
      student.crmSubjectsToImprove
    )
      ? student.crmSubjectsToImprove.join(
          ", "
        )
      : student.crmSubjectsToImprove
  );


  /*
   * Location
   */

  populateDistricts(
    student.crmDistrictId || ""
  );

  updateTalukDropdown(
    student.crmTalukId || ""
  );

  updateVillageDropdown(
    student.crmVillageId || ""
  );

  updateSchoolDropdown(
    student.crmSchoolId || ""
  );


  /*
   * Course
   */

  updateCourseDropdown(
    student.crmCourseId || ""
  );


  setValue(
    "enrollmentStatus",
    student.crmEnrollmentStatus ||
      "NOT ENROLLED"
  );


  /*
   * CRM
   */

  setValue(
    "leadStatus",
    student.crmLeadStatus ||
      "NEW"
  );

  setValue(
    "leadTemperature",
    student.crmLeadTemperature ||
      "COLD"
  );

  setValue(
    "leadSource",
    student.crmLeadSource
  );

  setValue(
    "campaignId",
    student.crmCampaignId
  );

  setValue(
    "assignedTo",
    student.crmAssignedTo
  );

  setValue(
    "counsellorNotes",
    student.crmCounsellorNotes
  );


  document.getElementById(
    "studentActive"
  ).checked =
    student.crmActive !== false;


  updateCoursePrice();


  studentModal.classList.add(
    "show"
  );

}


/* =========================================================
   CLOSE STUDENT MODAL
========================================================= */

function closeStudentModal() {

  studentModal.classList.remove(
    "show"
  );

  editingId = null;

}


/* =========================================================
   SAVE STUDENT
========================================================= */

studentForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!currentUser) {

      showToast(
        "Authentication required."
      );

      return;

    }


    const studentName =
      valueOf(
        "studentName"
      );


    const studentPhone =
      valueOf(
        "studentPhone"
      );


    const studentEmail =
      valueOf(
        "studentEmail"
      );


    if (!studentName) {

      showToast(
        "Enter student name."
      );

      return;

    }


    if (
      studentPhone &&
      !/^[0-9]{10}$/.test(
        studentPhone
      )
    ) {

      showToast(
        "Enter a valid 10-digit student phone number."
      );

      return;

    }


    /*
     * Location
     */

    const districtId =
      districtSelect.value;


    const talukId =
      talukSelect.value;


    const villageId =
      villageSelect.value;


    const schoolId =
      schoolSelect.value;


    const district =
      districts.find(
        item =>
          item.id === districtId
      );


    const taluk =
      taluks.find(
        item =>
          item.id === talukId
      );


    const village =
      villages.find(
        item =>
          item.id === villageId
      );


    const school =
      schools.find(
        item =>
          item.id === schoolId
      );


    /*
     * Course
     */

    const courseId =
      courseSelect.value;


    const course =
      courses.find(
        item =>
          item.id === courseId
      );


    const coursePrice =
      Number(
        course?.crmPrice ?? 0
      );


    const courseDiscount =
      Number(
        course?.crmDiscount ?? 0
      );


    const courseFinalPrice =
      Number(
        course?.crmFinalPrice ??
        Math.max(
          0,
          coursePrice -
          courseDiscount
        )
      );


    /*
     * Academic
     */

    const subjects =
      valueOf(
        "subjectsToImprove"
      )
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);


    const currentPercentage =
      numberOrNull(
        "currentPercentage"
      );


    const targetPercentage =
      numberOrNull(
        "targetPercentage"
      );


    /*
     * DUPLICATE PHONE CHECK
     */

    if (studentPhone) {

      const duplicate =
        students.find(
          student =>

            student.id !== editingId &&

            String(
              student.crmStudentPhone ||
              ""
            ) ===
            studentPhone

        );


      if (duplicate) {

        showToast(
          "A student with this phone number already exists."
        );

        return;

      }

    }


    /*
     * AUTO STUDENT CODE
     */

    let studentCode;


    if (editingId) {

      const oldStudent =
        students.find(
          student =>
            student.id === editingId
        );

      studentCode =
        oldStudent?.crmStudentCode ||
        generateStudentCode();

    } else {

      studentCode =
        generateStudentCode();

    }


    const studentData = {

      /* Student */

      crmStudentCode:
        studentCode,

      crmStudentName:
        studentName,

      crmStudentPhone:
        studentPhone,

      crmStudentEmail:
        studentEmail,

      crmInstagramUrl:
        valueOf(
          "instagramUrl"
        ),


      /* Parents */

      crmFatherName:
        valueOf(
          "fatherName"
        ),

      crmFatherPhone:
        valueOf(
          "fatherPhone"
        ),

      crmMotherName:
        valueOf(
          "motherName"
        ),

      crmMotherPhone:
        valueOf(
          "motherPhone"
        ),

      crmGuardianName:
        valueOf(
          "guardianName"
        ),

      crmPrimaryContact:
        valueOf(
          "primaryContact"
        ),


      /* Academic */

      crmClass:
        valueOf(
          "studentClass"
        ),

      crmBoard:
        valueOf(
          "studentBoard"
        ),

      crmMedium:
        valueOf(
          "studentMedium"
        ),

      crmCurrentPercentage:
        currentPercentage,

      crmTargetPercentage:
        targetPercentage,

      crmSubjectsToImprove:
        subjects,


      /* Location */

      crmDistrictId:
        districtId,

      crmDistrictName:
        district?.crmDistrictName ||
        "",

      crmTalukId:
        talukId,

      crmTalukName:
        taluk?.crmTalukName ||
        "",

      crmVillageId:
        villageId,

      crmVillageName:
        village?.crmVillageName ||
        "",

      crmSchoolId:
        schoolId,

      crmSchoolName:
        school?.crmSchoolName ||
        "",


      /* Course */

      crmCourseId:
        courseId,

      crmCourseName:
        course?.crmCourseName ||
        "",

      crmCoursePrice:
        coursePrice,

      crmCourseDiscount:
        courseDiscount,

      crmFinalFee:
        courseFinalPrice,

      crmEnrollmentStatus:
        valueOf(
          "enrollmentStatus"
        ),


      /* CRM */

      crmLeadStatus:
        valueOf(
          "leadStatus"
        ) || "NEW",

      crmLeadTemperature:
        valueOf(
          "leadTemperature"
        ) || "COLD",

      crmLeadSource:
        valueOf(
          "leadSource"
        ),

      crmCampaignId:
        valueOf(
          "campaignId"
        ),

      crmAssignedTo:
        valueOf(
          "assignedTo"
        ),

      crmCounsellorNotes:
        valueOf(
          "counsellorNotes"
        ),

      crmActive:
        document.getElementById(
          "studentActive"
        ).checked

    };


    const saveButton =
      document.getElementById(
        "saveStudentBtn"
      );


    saveButton.disabled = true;


    saveButton.textContent =
      editingId
        ? "Updating..."
        : "Saving...";


    try {

      if (editingId) {

        await updateDoc(
          doc(
            db,
            "crmStudents",
            editingId
          ),

          {
            ...studentData,

            crmUpdatedAt:
              serverTimestamp(),

            crmUpdatedBy:
              currentUser.uid
          }
        );


        showToast(
          "Student updated successfully."
        );

      } else {

        await addDoc(
          collection(
            db,
            "crmStudents"
          ),

          {
            ...studentData,

            crmCreatedAt:
              serverTimestamp(),

            crmCreatedBy:
              currentUser.uid,

            crmUpdatedAt:
              serverTimestamp(),

            crmUpdatedBy:
              currentUser.uid
          }
        );


        showToast(
          "Student added successfully."
        );

      }


      closeStudentModal();

    } catch (error) {

      console.error(
        "Student save error:",
        error
      );

      showToast(
        "Could not save student."
      );

    } finally {

      saveButton.disabled =
        false;

      saveButton.textContent =
        "Save Student";

    }

  }
);


/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(id) {

  deleteId = id;

  deleteModal.classList.add(
    "show"
  );

}


function closeDeleteModal() {

  deleteModal.classList.remove(
    "show"
  );

  deleteId = null;

}


async function confirmDelete() {

  if (!deleteId) return;


  const button =
    document.getElementById(
      "confirmDeleteBtn"
    );


  button.disabled = true;

  button.textContent =
    "Deleting...";


  try {

    await deleteDoc(
      doc(
        db,
        "crmStudents",
        deleteId
      )
    );


    showToast(
      "Student deleted."
    );


    closeDeleteModal();

  } catch (error) {

    console.error(
      "Student delete error:",
      error
    );

    showToast(
      "Could not delete student."
    );

  } finally {

    button.disabled = false;

    button.textContent =
      "Delete";

  }

}


/* =========================================================
   EVENTS
========================================================= */

document
  .getElementById(
    "addStudentBtn"
  )
  .addEventListener(
    "click",
    openAddModal
  );


document
  .getElementById(
    "closeStudentModal"
  )
  .addEventListener(
    "click",
    closeStudentModal
  );


document
  .getElementById(
    "cancelStudentBtn"
  )
  .addEventListener(
    "click",
    closeStudentModal
  );


document
  .getElementById(
    "cancelDeleteBtn"
  )
  .addEventListener(
    "click",
    closeDeleteModal
  );


document
  .getElementById(
    "confirmDeleteBtn"
  )
  .addEventListener(
    "click",
    confirmDelete
  );


/* LOCATION DEPENDENCY */

districtSelect.addEventListener(
  "change",
  () => {

    updateTalukDropdown();

  }
);


talukSelect.addEventListener(
  "change",
  () => {

    updateVillageDropdown();

    updateSchoolDropdown();

  }
);


villageSelect.addEventListener(
  "change",
  () => {

    updateSchoolDropdown();

  }
);


/* COURSE DEPENDENCY */

document
  .getElementById(
    "studentClass"
  )
  .addEventListener(
    "change",
    () => {

      updateCourseDropdown();

    }
  );


courseSelect.addEventListener(
  "change",
  updateCoursePrice
);


/* SEARCH */

searchInput.addEventListener(
  "input",
  renderStudents
);


classFilter.addEventListener(
  "change",
  renderStudents
);


statusFilter.addEventListener(
  "change",
  renderStudents
);


/* TABLE ACTIONS */

tableBody.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) return;


    const id =
      button.dataset.id;


    if (
      button.dataset.action ===
      "edit"
    ) {

      openEditModal(id);

    }


    if (
      button.dataset.action ===
      "delete"
    ) {

      openDeleteModal(id);

    }

  }
);


/* BACK TO CRM */

document
  .getElementById(
    "backToCRM"
  )
  .addEventListener(
    "click",
    () => {

      window.location.href =
        "../";

    }
  );


/* OUTSIDE MODAL */

studentModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      studentModal
    ) {

      closeStudentModal();

    }

  }
);


deleteModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      deleteModal
    ) {

      closeDeleteModal();

    }

  }
);


/* ESC */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      closeStudentModal();

      closeDeleteModal();

    }

  }
);


/* =========================================================
   HELPERS
========================================================= */

function valueOf(id) {

  return (
    document.getElementById(id)
      ?.value
      ?.trim() || ""
  );

}


function setValue(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (!element) return;

  element.value =
    value ?? "";

}


function numberOrNull(id) {

  const value =
    valueOf(id);

  if (!value) return null;

  const number =
    Number(value);

  return isNaN(number)
    ? null
    : number;

}


function generateStudentCode() {

  const date =
    new Date();


  const year =
    date.getFullYear()
      .toString()
      .slice(-2);


  const random =
    Math.floor(
      100000 +
      Math.random() * 900000
    );


  return `STU-${year}-${random}`;

}


function resetCoursePrice() {

  document.getElementById(
    "coursePriceDisplay"
  ).textContent =
    "₹0";

  document.getElementById(
    "courseDiscountDisplay"
  ).textContent =
    "₹0";

  document.getElementById(
    "courseFinalPriceDisplay"
  ).textContent =
    "₹0";

}


function formatCurrency(number) {

  return (
    "₹" +
    Number(
      number || 0
    ).toLocaleString(
      "en-IN"
    )
  );

}


function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function sortByName(a, b) {

  return String(
    a.crmStudentName || ""
  ).localeCompare(
    String(
      b.crmStudentName || ""
    )
  );

}


function sortByNameField(
  field
) {

  return (a, b) => {

    return String(
      a[field] || ""
    ).localeCompare(
      String(
        b[field] || ""
      )
    );

  };

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

  loader.style.opacity =
    "0";


  setTimeout(
    () => {

      loader.style.display =
        "none";

    },
    250
  );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
  message
) {

  const toast =
    document.getElementById(
      "toast"
    );


  const messageElement =
    document.getElementById(
      "toastMessage"
    );


  messageElement.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}
