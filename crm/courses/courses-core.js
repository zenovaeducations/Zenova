/* =========================================================
   ZENOVA CRM — COURSE MASTER
   Course + Course Subjects
========================================================= */

import { auth, db } from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let courses = [];

let currentCourse = null;

let editingCourseId = null;

let editingSubjectId = null;

let unsubscribeCourses = null;

let unsubscribeSubjects = null;


/* =========================================================
   DOM
========================================================= */

const appLoader =
  document.getElementById("appLoader");

const crmApp =
  document.getElementById("crmApp");


const courseModal =
  document.getElementById("courseModal");

const subjectModal =
  document.getElementById("subjectModal");

const subjectFormModal =
  document.getElementById("subjectFormModal");


const courseForm =
  document.getElementById("courseForm");

const subjectForm =
  document.getElementById("subjectForm");


const courseTableBody =
  document.getElementById("courseTableBody");

const emptyCourses =
  document.getElementById("emptyCourses");

const emptySubjects =
  document.getElementById("emptySubjects");

const subjectList =
  document.getElementById("subjectList");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../../index.html";

      return;
    }


    currentUser = user;


    setupUserUI();

    startCourseListener();


    crmApp.classList.remove("hidden");

    appLoader.classList.add("hidden");

  }
);


/* =========================================================
   USER UI
========================================================= */

function setupUserUI() {

  const email =
    currentUser.email ||
    "Administrator";


  const displayName =
    currentUser.displayName ||
    email.split("@")[0] ||
    "Admin";


  const initial =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "Z";


  document.getElementById(
    "sidebarUserName"
  ).textContent = displayName;


  document.getElementById(
    "sidebarUserEmail"
  ).textContent = email;


  document.getElementById(
    "userAvatar"
  ).textContent = initial;

}


/* =========================================================
   COURSE REALTIME LISTENER
========================================================= */

function startCourseListener() {

  if (unsubscribeCourses) {
    unsubscribeCourses();
  }


  const coursesQuery =
    query(
      collection(
        db,
        "crmCourses"
      ),
      orderBy(
        "crmCourseName",
        "asc"
      )
    );


  unsubscribeCourses =
    onSnapshot(
      coursesQuery,
      snapshot => {

        courses =
          snapshot.docs.map(
            item => ({
              id: item.id,
              ...item.data()
            })
          );


        renderCourses();

      },
      error => {

        console.error(
          "Course listener failed:",
          error
        );

      }
    );

}


/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

  const search =
    document.getElementById(
      "courseSearch"
    ).value
      .trim()
      .toLowerCase();


  const filtered =
    courses.filter(course => {

      const name =
        String(
          course.crmCourseName || ""
        ).toLowerCase();


      const code =
        String(
          course.crmCourseCode || ""
        ).toLowerCase();


      return (
        !search ||
        name.includes(search) ||
        code.includes(search)
      );

    });


  courseTableBody.innerHTML = "";


  emptyCourses.classList.toggle(
    "hidden",
    filtered.length !== 0
  );


  filtered.forEach(course => {

    const row =
      document.createElement("tr");


    const price =
      Number(
        course.crmPrice || 0
      );


    row.innerHTML = `

      <td>

        <div class="course-name">
          ${escapeHtml(
            course.crmCourseName || "-"
          )}
        </div>

        ${
          course.crmDescription
            ? `
              <div class="course-description">
                ${escapeHtml(
                  course.crmDescription
                )}
              </div>
            `
            : ""
        }

      </td>


      <td>
        <span class="code">
          ${escapeHtml(
            course.crmCourseCode || "-"
          )}
        </span>
      </td>


      <td>
        ${formatClass(
          course.crmClass
        )}
      </td>


      <td>
        ${escapeHtml(
          course.crmBoard || "-"
        )}
      </td>


      <td>
        ${escapeHtml(
          course.crmMedium || "-"
        )}
      </td>


      <td>
        ₹${price.toLocaleString("en-IN")}
      </td>


      <td>

        <span class="
          status
          ${
            course.crmActive === false
              ? "inactive"
              : "active"
          }
        ">

          ${
            course.crmActive === false
              ? "INACTIVE"
              : "ACTIVE"
          }

        </span>

      </td>


      <td>

        <div class="actions">

          <button
            class="action-button subjects"
            data-action="subjects"
            data-id="${course.id}">
            Subjects
          </button>

          <button
            class="action-button"
            data-action="edit"
            data-id="${course.id}">
            Edit
          </button>

          <button
            class="action-button"
            data-action="delete"
            data-id="${course.id}">
            Delete
          </button>

        </div>

      </td>

    `;


    courseTableBody.appendChild(row);

  });

}


/* =========================================================
   CLASS FORMAT
========================================================= */

function formatClass(value) {

  const map = {

    UNDER_8TH: "Below 8th",

    "8TH": "8th",

    "9TH": "9th",

    "10TH": "10th",

    "1ST_PUC": "1st PUC",

    "2ND_PUC": "2nd PUC",

    KCET: "KCET",

    NEET: "NEET",

    JEE: "JEE"

  };


  return escapeHtml(
    map[value] || value || "-"
  );

}


/* =========================================================
   COURSE EVENTS
========================================================= */

document
  .getElementById("addCourseButton")
  .addEventListener(
    "click",
    () => openCourseModal()
  );


document
  .getElementById("emptyAddCourse")
  .addEventListener(
    "click",
    () => openCourseModal()
  );


document
  .getElementById("courseSearch")
  .addEventListener(
    "input",
    renderCourses
  );


courseTableBody.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-action]"
      );


    if (!button) {
      return;
    }


    const id =
      button.dataset.id;


    const action =
      button.dataset.action;


    const course =
      courses.find(
        item => item.id === id
      );


    if (!course) {
      return;
    }


    if (action === "edit") {

      openCourseModal(course);

    }


    if (action === "subjects") {

      openSubjectsModal(course);

    }


    if (action === "delete") {

      deleteCourse(course);

    }

  }
);


/* =========================================================
   COURSE MODAL
========================================================= */

function openCourseModal(course = null) {

  editingCourseId =
    course ? course.id : null;


  document.getElementById(
    "courseModalTitle"
  ).textContent =
    course
      ? "Edit Course"
      : "Add Course";


  document.getElementById(
    "crmCourseName"
  ).value =
    course?.crmCourseName || "";


  document.getElementById(
    "crmCourseCode"
  ).value =
    course?.crmCourseCode || "";


  document.getElementById(
    "crmClass"
  ).value =
    course?.crmClass || "";


  document.getElementById(
    "crmBoard"
  ).value =
    course?.crmBoard || "";


  document.getElementById(
    "crmMedium"
  ).value =
    course?.crmMedium || "";


  document.getElementById(
    "crmPrice"
  ).value =
    course?.crmPrice ?? "";


  document.getElementById(
    "crmDiscount"
  ).value =
    course?.crmDiscount ?? "";


  document.getElementById(
    "crmDescription"
  ).value =
    course?.crmDescription || "";


  document.getElementById(
    "crmActive"
  ).checked =
    course?.crmActive !== false;


  hideCourseError();


  courseModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CLOSE COURSE MODAL
========================================================= */

function closeCourseModal() {

  courseModal.classList.add(
    "hidden"
  );

  editingCourseId = null;

  courseForm.reset();

}


/* =========================================================
   SAVE COURSE
========================================================= */

courseForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    hideCourseError();


    const name =
      document.getElementById(
        "crmCourseName"
      ).value.trim();


    const code =
      document.getElementById(
        "crmCourseCode"
      ).value.trim()
        .toUpperCase();


    const crmClass =
      document.getElementById(
        "crmClass"
      ).value;


    const board =
      document.getElementById(
        "crmBoard"
      ).value;


    const medium =
      document.getElementById(
        "crmMedium"
      ).value;


    const price =
      Number(
        document.getElementById(
          "crmPrice"
        ).value || 0
      );


    const discount =
      Number(
        document.getElementById(
          "crmDiscount"
        ).value || 0
      );


    const description =
      document.getElementById(
        "crmDescription"
      ).value.trim();


    const active =
      document.getElementById(
        "crmActive"
      ).checked;


    if (!name) {

      showCourseError(
        "Enter the course name."
      );

      return;
    }


    if (!code) {

      showCourseError(
        "Enter the course code."
      );

      return;
    }


    if (!crmClass) {

      showCourseError(
        "Select the class."
      );

      return;
    }


    if (price < 0 || discount < 0) {

      showCourseError(
        "Price and discount cannot be negative."
      );

      return;
    }


    if (discount > price) {

      showCourseError(
        "Discount cannot be greater than the course price."
      );

      return;
    }


    const finalPrice =
      price - discount;


    const saveButton =
      document.getElementById(
        "saveCourseButton"
      );


    saveButton.disabled = true;

    saveButton.textContent =
      editingCourseId
        ? "UPDATING..."
        : "SAVING...";


    try {

      const data = {

        crmCourseName:
          name,

        crmCourseCode:
          code,

        crmClass:
          crmClass,

        crmBoard:
          board,

        crmMedium:
          medium,

        crmDescription:
          description,

        crmPrice:
          price,

        crmDiscount:
          discount,

        crmFinalPrice:
          finalPrice,

        crmActive:
          active,

        crmUpdatedAt:
          serverTimestamp(),

        crmUpdatedBy:
          currentUser.uid

      };


      if (editingCourseId) {

        await updateDoc(
          doc(
            db,
            "crmCourses",
            editingCourseId
          ),
          data
        );

      } else {

        await addDoc(
          collection(
            db,
            "crmCourses"
          ),
          {

            ...data,

            crmCreatedAt:
              serverTimestamp(),

            crmCreatedBy:
              currentUser.uid

          }
        );

      }


      closeCourseModal();


    } catch (error) {

      console.error(
        "Save course failed:",
        error
      );


      showCourseError(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      saveButton.disabled = false;

      saveButton.textContent =
        "Save Course";

    }

  }
);


/* =========================================================
   DELETE COURSE
========================================================= */

async function deleteCourse(course) {

  const confirmed =
    confirm(
      `Delete "${course.crmCourseName}"?\n\nThe course will be permanently deleted.`
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "crmCourses",
        course.id
      )
    );


  } catch (error) {

    console.error(
      "Delete course failed:",
      error
    );


    alert(
      getFirebaseErrorMessage(
        error
      )
    );

  }

}


/* =========================================================
   SUBJECTS MODAL
========================================================= */

function openSubjectsModal(course) {

  currentCourse =
    course;


  document.getElementById(
    "subjectModalTitle"
  ).textContent =
    "Subjects";


  document.getElementById(
    "subjectCourseName"
  ).textContent =
    course.crmCourseName || "";


  subjectModal.classList.remove(
    "hidden"
  );


  startSubjectListener();

}


/* =========================================================
   SUBJECT REALTIME LISTENER
========================================================= */

function startSubjectListener() {

  if (unsubscribeSubjects) {

    unsubscribeSubjects();

    unsubscribeSubjects = null;

  }


  if (!currentCourse) {
    return;
  }


  const subjectQuery =
    query(
      collection(
        db,
        "crmCourseSubjects"
      ),
      orderBy(
        "priority",
        "asc"
      )
    );


  unsubscribeSubjects =
    onSnapshot(
      subjectQuery,
      snapshot => {

        const subjects =
          snapshot.docs

            .map(
              item => ({
                id: item.id,
                ...item.data()
              })
            )

            .filter(
              item =>
                item.crmCourseId ===
                currentCourse.id
            );


        renderSubjects(
          subjects
        );

      },
      error => {

        console.error(
          "Subject listener failed:",
          error
        );

      }
    );

}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects(subjects) {

  subjectList.innerHTML = "";


  document.getElementById(
    "subjectCount"
  ).textContent =
    subjects.length;


  emptySubjects.classList.toggle(
    "hidden",
    subjects.length !== 0
  );


  subjects.forEach(
    (subject, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "subject-item";


      item.innerHTML = `

        <div class="subject-number">
          ${index + 1}
        </div>


        <div class="subject-info">

          <strong>
            ${escapeHtml(
              subject.name || "-"
            )}
          </strong>


          <div class="subject-meta">

            ${
              subject.code
                ? `
                  <span class="subject-code">
                    ${escapeHtml(
                      subject.code
                    )}
                  </span>
                `
                : ""
            }


            <span>
              Priority:
              ${Number(
                subject.priority || 1
              )}
            </span>


            <span class="
              subject-status
              ${
                subject.active === false
                  ? "inactive"
                  : "active"
              }
            ">

              ${
                subject.active === false
                  ? "INACTIVE"
                  : "ACTIVE"
              }

            </span>

          </div>

        </div>


        <div class="subject-actions">

          <button
            class="action-button"
            data-subject-action="edit"
            data-id="${subject.id}">
            Edit
          </button>


          <button
            class="action-button"
            data-subject-action="delete"
            data-id="${subject.id}">
            Delete
          </button>

        </div>

      `;


      subjectList.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   SUBJECT EVENTS
========================================================= */

document
  .getElementById("addSubjectButton")
  .addEventListener(
    "click",
    () => openSubjectForm()
  );


document
  .getElementById("emptyAddSubject")
  .addEventListener(
    "click",
    () => openSubjectForm()
  );


subjectList.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "button[data-subject-action]"
      );


    if (!button) {
      return;
    }


    const id =
      button.dataset.id;


    const action =
      button.dataset.subjectAction;


    if (action === "edit") {

      editSubject(id);

    }


    if (action === "delete") {

      deleteSubject(id);

    }

  }
);


/* =========================================================
   OPEN SUBJECT FORM
========================================================= */

function openSubjectForm(
  subject = null
) {

  editingSubjectId =
    subject
      ? subject.id
      : null;


  document.getElementById(
    "subjectFormTitle"
  ).textContent =
    subject
      ? "Edit Subject"
      : "Add Subject";


  document.getElementById(
    "subjectName"
  ).value =
    subject?.name || "";


  document.getElementById(
    "subjectCode"
  ).value =
    subject?.code || "";


  document.getElementById(
    "subjectPriority"
  ).value =
    subject?.priority ?? 1;


  document.getElementById(
    "subjectDescription"
  ).value =
    subject?.description || "";


  document.getElementById(
    "subjectActive"
  ).checked =
    subject?.active !== false;


  hideSubjectError();


  subjectFormModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   EDIT SUBJECT
========================================================= */

async function editSubject(id) {

  if (!currentCourse) {
    return;
  }


  try {

    /*
     * We use the realtime list currently
     * displayed in the modal.
     */

    const snapshot =
      await new Promise(
        resolve => {

          const unsubscribe =
            onSnapshot(
              collection(
                db,
                "crmCourseSubjects"
              ),
              snap => {

                unsubscribe();

                resolve(snap);

              }
            );

        }
      );


    const subjectDoc =
      snapshot.docs.find(
        item =>
          item.id === id &&
          item.data().crmCourseId ===
            currentCourse.id
      );


    if (!subjectDoc) {

      alert(
        "Subject could not be found."
      );

      return;
    }


    openSubjectForm({
      id: subjectDoc.id,
      ...subjectDoc.data()
    });


  } catch (error) {

    console.error(
      "Load subject failed:",
      error
    );

  }

}


/* =========================================================
   SAVE SUBJECT
========================================================= */

subjectForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    hideSubjectError();


    if (!currentCourse) {

      showSubjectError(
        "Course not selected."
      );

      return;
    }


    const name =
      document.getElementById(
        "subjectName"
      ).value.trim();


    const code =
      document.getElementById(
        "subjectCode"
      ).value.trim()
        .toUpperCase();


    const priority =
      Number(
        document.getElementById(
          "subjectPriority"
        ).value || 1
      );


    const description =
      document.getElementById(
        "subjectDescription"
      ).value.trim();


    const active =
      document.getElementById(
        "subjectActive"
      ).checked;


    if (!name) {

      showSubjectError(
        "Enter the subject name."
      );

      return;
    }


    if (
      !Number.isFinite(priority) ||
      priority < 1
    ) {

      showSubjectError(
        "Priority must be 1 or greater."
      );

      return;
    }


    const saveButton =
      document.getElementById(
        "saveSubjectButton"
      );


    saveButton.disabled = true;

    saveButton.textContent =
      editingSubjectId
        ? "UPDATING..."
        : "SAVING...";


    try {

      const data = {

        crmCourseId:
          currentCourse.id,

        crmCourseName:
          currentCourse.crmCourseName || "",

        name:
          name,

        code:
          code,

        description:
          description,

        priority:
          priority,

        active:
          active,

        updatedAt:
          serverTimestamp(),

        updatedBy:
          currentUser.uid

      };


      if (editingSubjectId) {

        await updateDoc(
          doc(
            db,
            "crmCourseSubjects",
            editingSubjectId
          ),
          data
        );

      } else {

        await addDoc(
          collection(
            db,
            "crmCourseSubjects"
          ),
          {

            ...data,

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );

      }


      closeSubjectForm();


    } catch (error) {

      console.error(
        "Save subject failed:",
        error
      );


      showSubjectError(
        getFirebaseErrorMessage(
          error
        )
      );

    } finally {

      saveButton.disabled = false;

      saveButton.textContent =
        "Save Subject";

    }

  }
);


/* =========================================================
   DELETE SUBJECT
========================================================= */

async function deleteSubject(id) {

  const confirmed =
    confirm(
      "Delete this subject?\n\nThis cannot be undone."
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "crmCourseSubjects",
        id
      )
    );


  } catch (error) {

    console.error(
      "Delete subject failed:",
      error
    );


    alert(
      getFirebaseErrorMessage(
        error
      )
    );

  }

}


/* =========================================================
   CLOSE SUBJECT FORM
========================================================= */

function closeSubjectForm() {

  subjectFormModal.classList.add(
    "hidden"
  );

  editingSubjectId = null;

  subjectForm.reset();

  document.getElementById(
    "subjectPriority"
  ).value = 1;

  document.getElementById(
    "subjectActive"
  ).checked = true;

}


/* =========================================================
   CLOSE SUBJECTS MODAL
========================================================= */

function closeSubjectsModal() {

  if (unsubscribeSubjects) {

    unsubscribeSubjects();

    unsubscribeSubjects = null;

  }


  subjectModal.classList.add(
    "hidden"
  );


  currentCourse = null;

}


/* =========================================================
   BUTTONS
========================================================= */

document
  .getElementById("closeCourseModal")
  .addEventListener(
    "click",
    closeCourseModal
  );


document
  .getElementById("cancelCourseButton")
  .addEventListener(
    "click",
    closeCourseModal
  );


document
  .getElementById("closeSubjectModal")
  .addEventListener(
    "click",
    closeSubjectsModal
  );


document
  .getElementById("closeSubjectForm")
  .addEventListener(
    "click",
    closeSubjectForm
  );


document
  .getElementById("cancelSubjectForm")
  .addEventListener(
    "click",
    closeSubjectForm
  );


/* =========================================================
   OUTSIDE CLICK
========================================================= */

courseModal.addEventListener(
  "click",
  event => {

    if (
      event.target === courseModal
    ) {

      closeCourseModal();

    }

  }
);


subjectModal.addEventListener(
  "click",
  event => {

    if (
      event.target === subjectModal
    ) {

      closeSubjectsModal();

    }

  }
);


subjectFormModal.addEventListener(
  "click",
  event => {

    if (
      event.target === subjectFormModal
    ) {

      closeSubjectForm();

    }

  }
);


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key !== "Escape"
    ) {
      return;
    }


    if (
      !subjectFormModal.classList.contains(
        "hidden"
      )
    ) {

      closeSubjectForm();

      return;

    }


    if (
      !subjectModal.classList.contains(
        "hidden"
      )
    ) {

      closeSubjectsModal();

      return;

    }


    if (
      !courseModal.classList.contains(
        "hidden"
      )
    ) {

      closeCourseModal();

    }

  }
);


/* =========================================================
   ERRORS
========================================================= */

function showCourseError(
  message
) {

  const element =
    document.getElementById(
      "courseFormError"
    );


  element.textContent =
    message;


  element.classList.remove(
    "hidden"
  );

}


function hideCourseError() {

  const element =
    document.getElementById(
      "courseFormError"
    );


  element.textContent = "";

  element.classList.add(
    "hidden"
  );

}


function showSubjectError(
  message
) {

  const element =
    document.getElementById(
      "subjectFormError"
    );


  element.textContent =
    message;


  element.classList.remove(
    "hidden"
  );

}


function hideSubjectError() {

  const element =
    document.getElementById(
      "subjectFormError"
    );


  element.textContent = "";

  element.classList.add(
    "hidden"
  );

}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getFirebaseErrorMessage(
  error
) {

  if (
    error?.code ===
    "permission-denied"
  ) {

    return "You do not have permission to perform this action.";

  }


  return (
    error?.message ||
    "Something went wrong."
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
  value
) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
