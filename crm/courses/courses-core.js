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

let courses = [];

let editingId = null;

let deleteId = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
  document.getElementById("pageLoader");

const tableBody =
  document.getElementById("courseTableBody");

const searchInput =
  document.getElementById("searchInput");

const courseModal =
  document.getElementById("courseModal");

const deleteModal =
  document.getElementById("deleteModal");

const courseForm =
  document.getElementById("courseForm");

const modalTitle =
  document.getElementById("modalTitle");

const saveCourseBtn =
  document.getElementById("saveCourseBtn");

const finalPricePreview =
  document.getElementById("finalPricePreview");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "../../index.html";

    return;
  }

  currentUser = user;

  startCourseListener();

});


/* =========================================================
   FIRESTORE REALTIME LISTENER
========================================================= */

function startCourseListener() {

  const coursesRef =
    collection(db, "crmCourses");

  const coursesQuery =
    query(
      coursesRef,
      orderBy("crmCourseName")
    );

  onSnapshot(
    coursesQuery,

    (snapshot) => {

      courses = [];

      snapshot.forEach((docSnap) => {

        courses.push({
          id: docSnap.id,
          ...docSnap.data()
        });

      });

      renderCourses();

      updateStats();

      hideLoader();

    },

    (error) => {

      console.error(
        "Course listener error:",
        error
      );

      /*
       * Fallback without orderBy.
       * This avoids the page breaking if the
       * ordered query encounters an index issue.
       */

      onSnapshot(
        coursesRef,

        (fallbackSnapshot) => {

          courses = [];

          fallbackSnapshot.forEach((docSnap) => {

            courses.push({
              id: docSnap.id,
              ...docSnap.data()
            });

          });

          courses.sort((a, b) => {

            return String(
              a.crmCourseName || ""
            ).localeCompare(
              String(
                b.crmCourseName || ""
              )
            );

          });

          renderCourses();

          updateStats();

          hideLoader();

        },

        (fallbackError) => {

          console.error(
            "Fallback listener error:",
            fallbackError
          );

          showToast(
            "Unable to load courses."
          );

          hideLoader();

        }
      );

    }
  );

}


/* =========================================================
   RENDER
========================================================= */

function renderCourses() {

  const search =
    searchInput.value
      .trim()
      .toLowerCase();

  const filtered =
    courses.filter((course) => {

      if (!search) return true;

      const values = [

        course.crmCourseName,

        course.crmCourseCode,

        course.crmClass,

        course.crmBoard,

        course.crmMedium

      ];

      return values.some((value) =>

        String(value || "")
          .toLowerCase()
          .includes(search)

      );

    });


  document.getElementById(
    "courseCountLabel"
  ).textContent =
    `${filtered.length} ${
      filtered.length === 1
        ? "course"
        : "courses"
    }`;


  if (!filtered.length) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          ${
            search
              ? "No courses match your search."
              : "No courses created yet."
          }
        </td>
      </tr>
    `;

    return;
  }


  tableBody.innerHTML =
    filtered.map((course) => {

      const name =
        escapeHTML(
          course.crmCourseName || "Untitled Course"
        );

      const code =
        escapeHTML(
          course.crmCourseCode || "—"
        );

      const className =
        escapeHTML(
          course.crmClass || "—"
        );

      const board =
        escapeHTML(
          course.crmBoard || "—"
        );

      const medium =
        escapeHTML(
          course.crmMedium || "—"
        );

      const price =
        Number(
          course.crmFinalPrice ??
          course.crmPrice ??
          0
        );

      const active =
        course.crmActive !== false;


      return `
        <tr>

          <td>
            <div class="course-name">
              ${name}
            </div>

            ${
              course.crmDescription
                ? `
                  <div class="course-description">
                    ${escapeHTML(
                      course.crmDescription
                    )}
                  </div>
                `
                : ""
            }
          </td>

          <td>
            <span class="code">
              ${code}
            </span>
          </td>

          <td>
            ${className}
          </td>

          <td>
            ${board}
          </td>

          <td>
            ${medium}
          </td>

          <td>
            <span class="price">
              ${formatCurrency(price)}
            </span>
          </td>

          <td>

            <span class="status ${
              active
                ? "active"
                : "inactive"
            }">

              ${
                active
                  ? "Active"
                  : "Inactive"
              }

            </span>

          </td>

          <td>

            <div class="actions">

              <button
                class="action-btn"
                data-action="edit"
                data-id="${course.id}"
              >
                Edit
              </button>

              <button
                class="action-btn delete"
                data-action="delete"
                data-id="${course.id}"
              >
                Delete
              </button>

            </div>

          </td>

        </tr>
      `;

    }).join("");

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  const total =
    courses.length;

  const active =
    courses.filter(
      course =>
        course.crmActive !== false
    ).length;

  const inactive =
    total - active;


  const activePrices =
    courses
      .filter(
        course =>
          course.crmActive !== false
      )
      .map(
        course =>
          Number(
            course.crmFinalPrice ??
            course.crmPrice ??
            0
          )
      )
      .filter(
        price => !isNaN(price)
      );


  const average =
    activePrices.length
      ? activePrices.reduce(
          (sum, price) =>
            sum + price,
          0
        ) / activePrices.length
      : 0;


  document.getElementById(
    "totalCourses"
  ).textContent = total;


  document.getElementById(
    "activeCourses"
  ).textContent = active;


  document.getElementById(
    "inactiveCourses"
  ).textContent = inactive;


  document.getElementById(
    "averagePrice"
  ).textContent =
    formatCurrency(
      Math.round(average)
    );

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

  editingId = null;

  modalTitle.textContent =
    "Add Course";

  saveCourseBtn.textContent =
    "Save Course";

  courseForm.reset();

  document.getElementById(
    "courseDiscount"
  ).value = "0";

  document.getElementById(
    "courseActive"
  ).checked = true;

  updateFinalPrice();

  courseModal.classList.add("show");

  setTimeout(() => {

    document.getElementById(
      "courseName"
    ).focus();

  }, 100);

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(id) {

  const course =
    courses.find(
      item => item.id === id
    );

  if (!course) return;

  editingId = id;

  modalTitle.textContent =
    "Edit Course";

  saveCourseBtn.textContent =
    "Update Course";


  document.getElementById(
    "courseName"
  ).value =
    course.crmCourseName || "";


  document.getElementById(
    "courseCode"
  ).value =
    course.crmCourseCode || "";


  document.getElementById(
    "courseClass"
  ).value =
    course.crmClass || "";


  document.getElementById(
    "courseBoard"
  ).value =
    course.crmBoard || "";


  document.getElementById(
    "courseMedium"
  ).value =
    course.crmMedium || "";


  document.getElementById(
    "coursePrice"
  ).value =
    course.crmPrice ?? "";


  document.getElementById(
    "courseDiscount"
  ).value =
    course.crmDiscount ?? 0;


  document.getElementById(
    "courseDescription"
  ).value =
    course.crmDescription || "";


  document.getElementById(
    "courseActive"
  ).checked =
    course.crmActive !== false;


  updateFinalPrice();

  courseModal.classList.add("show");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeCourseModal() {

  courseModal.classList.remove("show");

  editingId = null;

}


/* =========================================================
   SAVE COURSE
========================================================= */

courseForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    if (!currentUser) {

      showToast(
        "Authentication required."
      );

      return;

    }


    const courseName =
      document.getElementById(
        "courseName"
      ).value.trim();


    const courseCodeInput =
      document.getElementById(
        "courseCode"
      ).value.trim();


    const courseClass =
      document.getElementById(
        "courseClass"
      ).value;


    const board =
      document.getElementById(
        "courseBoard"
      ).value;


    const medium =
      document.getElementById(
        "courseMedium"
      ).value;


    const price =
      Number(
        document.getElementById(
          "coursePrice"
        ).value
      );


    const discount =
      Number(
        document.getElementById(
          "courseDiscount"
        ).value
      ) || 0;


    const description =
      document.getElementById(
        "courseDescription"
      ).value.trim();


    const active =
      document.getElementById(
        "courseActive"
      ).checked;


    if (!courseName) {

      showToast(
        "Enter the course name."
      );

      return;

    }


    if (!courseClass) {

      showToast(
        "Select the class."
      );

      return;

    }


    if (
      isNaN(price) ||
      price < 0
    ) {

      showToast(
        "Enter a valid course price."
      );

      return;

    }


    if (discount < 0) {

      showToast(
        "Discount cannot be negative."
      );

      return;

    }


    if (discount > price) {

      showToast(
        "Discount cannot be greater than the course price."
      );

      return;

    }


    const finalPrice =
      price - discount;


    /*
     * Automatically generate course code
     * when admin leaves it empty.
     */

    const courseCode =
      courseCodeInput ||
      generateCourseCode(
        courseName
      );


    /*
     * Duplicate course check.
     */

    const duplicate =
      courses.find(course => {

        if (
          editingId &&
          course.id === editingId
        ) {
          return false;
        }

        const existingName =
          String(
            course.crmCourseName || ""
          )
          .trim()
          .toLowerCase();


        const existingCode =
          String(
            course.crmCourseCode || ""
          )
          .trim()
          .toLowerCase();


        return (
          (
            existingName ===
            courseName.toLowerCase()
          )
          &&
          (
            course.crmClass ===
            courseClass
          )
        )
        ||
        (
          existingCode &&
          existingCode ===
          courseCode.toLowerCase()
        );

      });


    if (duplicate) {

      showToast(
        "A similar course or course code already exists."
      );

      return;

    }


    saveCourseBtn.disabled = true;

    saveCourseBtn.textContent =
      editingId
        ? "Updating..."
        : "Saving...";


    try {

      const courseData = {

        crmCourseName:
          courseName,

        crmCourseCode:
          courseCode,

        crmClass:
          courseClass,

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
          active

      };


      if (editingId) {

        await updateDoc(
          doc(
            db,
            "crmCourses",
            editingId
          ),

          {
            ...courseData,

            crmUpdatedAt:
              serverTimestamp(),

            crmUpdatedBy:
              currentUser.uid
          }
        );


        showToast(
          "Course updated successfully."
        );

      } else {

        await addDoc(
          collection(
            db,
            "crmCourses"
          ),

          {
            ...courseData,

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
          "Course created successfully."
        );

      }


      closeCourseModal();

    } catch (error) {

      console.error(
        "Save course error:",
        error
      );

      showToast(
        "Could not save the course."
      );

    } finally {

      saveCourseBtn.disabled =
        false;

      saveCourseBtn.textContent =
        "Save Course";

    }

  }
);


/* =========================================================
   PRICE CALCULATION
========================================================= */

function updateFinalPrice() {

  const price =
    Number(
      document.getElementById(
        "coursePrice"
      ).value
    ) || 0;


  const discount =
    Number(
      document.getElementById(
        "courseDiscount"
      ).value
    ) || 0;


  const finalPrice =
    Math.max(
      0,
      price - discount
    );


  finalPricePreview.textContent =
    formatNumber(finalPrice);

}


/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(id) {

  deleteId = id;

  deleteModal.classList.add("show");

}


function closeDeleteModal() {

  deleteModal.classList.remove("show");

  deleteId = null;

}


async function confirmDelete() {

  if (!deleteId) return;

  if (!currentUser) {

    showToast(
      "Authentication required."
    );

    return;

  }


  const id =
    deleteId;


  const confirmButton =
    document.getElementById(
      "confirmDeleteBtn"
    );


  confirmButton.disabled = true;

  confirmButton.textContent =
    "Deleting...";


  try {

    await deleteDoc(
      doc(
        db,
        "crmCourses",
        id
      )
    );


    showToast(
      "Course deleted."
    );


    closeDeleteModal();

  } catch (error) {

    console.error(
      "Delete error:",
      error
    );

    showToast(
      "Could not delete the course."
    );

  } finally {

    confirmButton.disabled =
      false;

    confirmButton.textContent =
      "Delete";

  }

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

document
  .getElementById("addCourseBtn")
  .addEventListener(
    "click",
    openAddModal
  );


document
  .getElementById("closeCourseModal")
  .addEventListener(
    "click",
    closeCourseModal
  );


document
  .getElementById("cancelCourseBtn")
  .addEventListener(
    "click",
    closeCourseModal
  );


document
  .getElementById("cancelDeleteBtn")
  .addEventListener(
    "click",
    closeDeleteModal
  );


document
  .getElementById("confirmDeleteBtn")
  .addEventListener(
    "click",
    confirmDelete
  );


document
  .getElementById("coursePrice")
  .addEventListener(
    "input",
    updateFinalPrice
  );


document
  .getElementById("courseDiscount")
  .addEventListener(
    "input",
    updateFinalPrice
  );


searchInput.addEventListener(
  "input",
  renderCourses
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

    const action =
      button.dataset.action;


    if (action === "edit") {

      openEditModal(id);

    }


    if (action === "delete") {

      openDeleteModal(id);

    }

  }
);


/* BACK TO CRM */

document
  .getElementById("backToCRM")
  .addEventListener(
    "click",
    () => {

      window.location.href = "../";

    }
  );


/* CLOSE WHEN CLICKING OUTSIDE */

courseModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      courseModal
    ) {

      closeCourseModal();

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


/* ESC KEY */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      closeCourseModal();

      closeDeleteModal();

    }

  }
);


/* =========================================================
   HELPERS
========================================================= */

function generateCourseCode(name) {

  const cleaned =
    name
      .toUpperCase()
      .replace(
        /[^A-Z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );


  const base =
    cleaned.substring(
      0,
      12
    );


  return (
    base ||
    "COURSE"
  );

}


function formatNumber(number) {

  return Number(
    number || 0
  ).toLocaleString(
    "en-IN"
  );

}


function formatCurrency(number) {

  return (
    "₹" +
    formatNumber(number)
  );

}


function escapeHTML(value) {

  return String(value ?? "")
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


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

  loader.style.opacity = "0";

  setTimeout(() => {

    loader.style.display =
      "none";

  }, 250);

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  const toastMessage =
    document.getElementById(
      "toastMessage"
    );


  toastMessage.textContent =
    message;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3000);

          }
