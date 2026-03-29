(function () {
  var HOME_PATH = "/";
  var LOGIN_PATH = "/login";
  var REGISTER_PATH = "/register";
  var DOCTOR_LOGIN_PATH = "/doctor-login";
  var PATIENT_LOGIN_PATH = "/patient-login";
  var BODY_SELECTOR = ".body";
  var TITLE_SELECTOR = "h1.text-center";
  var GRID_SELECTOR = ".ant-row";
  var applyTimer = null;
  var routeTimer = null;

  function normalize(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function toNumber(value) {
    var match = normalize(value).match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function isHomeRoute() {
    return window.location.pathname === HOME_PATH;
  }

  function isLoginRoute() {
    return window.location.pathname === LOGIN_PATH;
  }

  function isRegisterRoute() {
    return window.location.pathname === REGISTER_PATH;
  }

  function getAuthRoute() {
    if (window.location.pathname === DOCTOR_LOGIN_PATH) {
      return "doctor";
    }

    if (window.location.pathname === PATIENT_LOGIN_PATH) {
      return "patient";
    }

    if (isLoginRoute()) {
      return "selector";
    }

    return "";
  }

  function isStandaloneAuthRoute() {
    var route = getAuthRoute();
    return route === "doctor" || route === "patient";
  }

  function extractDoctorData(card) {
    var lines = Array.prototype.slice.call(card.querySelectorAll(".card-body p"));
    var info = {
      name: normalize(card.querySelector(".card-header") && card.querySelector(".card-header").textContent),
      specialization: "",
      experience: "",
      experienceYears: 0,
      fee: "",
      feeValue: 0,
      timings: "",
    };

    lines.forEach(function (line) {
      var text = normalize(line.textContent);

      if (/^specialization/i.test(text)) {
        info.specialization = normalize(text.replace(/^specialization/i, ""));
      } else if (/^experience/i.test(text)) {
        info.experience = normalize(text.replace(/^experience/i, ""));
        info.experienceYears = toNumber(info.experience);
      } else if (/^fees per cunsaltation/i.test(text) || /^fees per consultation/i.test(text)) {
        info.fee = normalize(
          text.replace(/^fees per cunsaltation/i, "").replace(/^fees per consultation/i, "")
        );
        info.feeValue = toNumber(info.fee);
      } else if (/^timings/i.test(text)) {
        info.timings = normalize(text.replace(/^timings/i, ""));
      }
    });

    return info;
  }

  function collectCards(body) {
    return Array.prototype.slice.call(body.querySelectorAll(GRID_SELECTOR + " .card"));
  }

  function getState(body) {
    if (!body.__landingState) {
      body.__landingState = {
        query: "",
        specialty: "All",
      };
    }

    return body.__landingState;
  }

  function getMetrics(cards) {
    var data = cards.map(extractDoctorData);
    var total = data.length;
    var specialtyCounts = {};
    var totalExperience = 0;
    var feeValues = [];

    data.forEach(function (item) {
      if (item.specialization) {
        specialtyCounts[item.specialization] = (specialtyCounts[item.specialization] || 0) + 1;
      }
      if (item.experienceYears) {
        totalExperience += item.experienceYears;
      }
      if (item.feeValue) {
        feeValues.push(item.feeValue);
      }
    });

    var specialties = Object.keys(specialtyCounts)
      .sort(function (left, right) {
        return specialtyCounts[right] - specialtyCounts[left];
      });

    return {
      total: total,
      uniqueSpecialties: specialties.length,
      averageExperience: total ? Math.round(totalExperience / total) : 0,
      startingFee: feeValues.length ? Math.min.apply(Math, feeValues) : 0,
      topSpecialties: specialties.slice(0, 5),
      topSpecialtyLabel: specialties[0] || "General care",
    };
  }

  function createHero(body, metrics) {
    var headerLink = document.querySelector(".header-content a");
    var userName = normalize(headerLink && headerLink.textContent).split(" ")[0] || "there";
    var hero = document.createElement("section");
    hero.className = "landing-home-hero";
    hero.innerHTML =
      '<div class="landing-home-copy">' +
      '<span class="landing-eyebrow">Unified care workspace</span>' +
      "<h2>Welcome back, " +
      userName +
      ".</h2>" +
      "<p>One shared platform for patients and doctors to manage appointments, discover care options, and stay on top of updates in one place.</p>" +
      '<div class="landing-hero-actions">' +
      '<a class="landing-primary-action" href="#doctor-directory">Open directory</a>' +
      '<a class="landing-secondary-action" href="/appointments">View appointments</a>' +
      "</div>" +
      '<div class="landing-hero-note"><i class="fa-solid fa-shield-heart"></i><span>Built for both doctors and patients with one shared login experience.</span></div>' +
      "</div>" +
      '<div class="landing-hero-panel">' +
      '<div class="landing-stat-card">' +
      '<span class="landing-stat-label">Doctors listed</span>' +
      '<strong class="landing-stat-value">' +
      metrics.total +
      "</strong>" +
      '<span class="landing-stat-meta">Available across the shared care network</span>' +
      "</div>" +
      '<div class="landing-stat-card">' +
      '<span class="landing-stat-label">Specialties</span>' +
      '<strong class="landing-stat-value">' +
      metrics.uniqueSpecialties +
      "</strong>" +
      '<span class="landing-stat-meta">Including ' +
      metrics.topSpecialtyLabel +
      "</span>" +
      "</div>" +
      '<div class="landing-stat-card">' +
      '<span class="landing-stat-label">Experience range</span>' +
      '<strong class="landing-stat-value">' +
      metrics.averageExperience +
      "+ yrs</strong>" +
      '<span class="landing-stat-meta">Helping patients choose and doctors stand out clearly</span>' +
      "</div>" +
      '<div class="landing-stat-card">' +
      '<span class="landing-stat-label">Consultation fee</span>' +
      '<strong class="landing-stat-value">' +
      (metrics.startingFee ? "Rs. " + metrics.startingFee : "Flexible") +
      "</strong>" +
      '<span class="landing-stat-meta">Clear pricing for faster booking decisions</span>' +
      "</div>" +
      "</div>";

    body.insertBefore(hero, body.firstChild);
    return hero;
  }

  function createToolbar(body, title, row, metrics, state) {
    var toolbar = document.createElement("section");
    var chipMarkup = ['<button type="button" class="landing-chip is-active" data-specialty="All">All doctors</button>']
      .concat(
        metrics.topSpecialties.map(function (specialty) {
          return (
            '<button type="button" class="landing-chip" data-specialty="' +
            specialty.replace(/"/g, "&quot;") +
            '">' +
            specialty +
            "</button>"
          );
        })
      )
      .join("");

    title.textContent = "Available doctors";
    title.classList.add("landing-section-title");
    title.id = "doctor-directory";
    row.classList.add("doctor-directory-grid");

    toolbar.className = "landing-toolbar";
    toolbar.innerHTML =
      '<div class="landing-toolbar-top">' +
      '<div class="landing-toolbar-copy">' +
      '<span class="landing-section-kicker">Doctor directory</span>' +
      '<p class="landing-section-subtitle">Filter specialists by name or expertise and book when you are ready.</p>' +
      "</div>" +
      '<label class="landing-search-field" aria-label="Search doctors">' +
      '<i class="fa-solid fa-magnifying-glass"></i>' +
      '<input type="search" class="landing-search-input" placeholder="Search by doctor or specialization" value="' +
      state.query.replace(/"/g, "&quot;") +
      '">' +
      "</label>" +
      "</div>" +
      '<div class="landing-chip-row">' +
      chipMarkup +
      "</div>" +
      '<p class="landing-results-count" aria-live="polite"></p>';

    body.insertBefore(toolbar, row);
    return toolbar;
  }

  function ensureEmptyState(body, row) {
    var empty = body.querySelector(".landing-empty-state");

    if (!empty) {
      empty = document.createElement("div");
      empty.className = "landing-empty-state";
      empty.innerHTML =
        '<i class="fa-solid fa-user-doctor"></i>' +
        "<strong>No doctors match this filter.</strong>" +
        "<span>Try a broader search term or switch to a different specialty.</span>";
      row.insertAdjacentElement("afterend", empty);
    }

    return empty;
  }

  function styleCards(cards) {
    cards.forEach(function (card) {
      var data = extractDoctorData(card);

      card.classList.add("doctor-directory-card");
      card.dataset.search = normalize(
        [data.name, data.specialization, data.experience, data.fee, data.timings].join(" ")
      ).toLowerCase();
      card.dataset.specialty = data.specialization || "General care";

      if (!card.querySelector(".doctor-card-accent")) {
        var accent = document.createElement("span");
        accent.className = "doctor-card-accent";
        accent.textContent = data.specialization || "Doctor";
        card.insertBefore(accent, card.firstChild);
      } else {
        card.querySelector(".doctor-card-accent").textContent = data.specialization || "Doctor";
      }
    });
  }

  function applyFilters(body) {
    var row = body.querySelector("." + "doctor-directory-grid");
    if (!row) {
      return;
    }

    var cards = collectCards(body);
    var state = getState(body);
    var results = body.querySelector(".landing-results-count");
    var empty = ensureEmptyState(body, row);
    var visibleCount = 0;

    cards.forEach(function (card) {
      var matchesQuery = !state.query || card.dataset.search.indexOf(state.query.toLowerCase()) >= 0;
      var matchesSpecialty =
        state.specialty === "All" || normalize(card.dataset.specialty) === normalize(state.specialty);
      var isVisible = matchesQuery && matchesSpecialty;

      card.style.display = isVisible ? "" : "none";
      visibleCount += isVisible ? 1 : 0;
    });

    Array.prototype.slice.call(body.querySelectorAll(".landing-chip")).forEach(function (chip) {
      var isActive = chip.dataset.specialty === state.specialty;
      chip.classList.toggle("is-active", isActive);
    });

    if (results) {
      results.textContent =
        visibleCount +
        (visibleCount === 1 ? " doctor matches your filters." : " doctors match your filters.");
    }

    empty.classList.toggle("is-visible", visibleCount === 0);
  }

  function wireInteractions(body) {
    var state = getState(body);
    var searchInput = body.querySelector(".landing-search-input");

    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = "true";
      searchInput.addEventListener("input", function (event) {
        state.query = normalize(event.target.value);
        applyFilters(body);
      });
    }

    Array.prototype.slice.call(body.querySelectorAll(".landing-chip")).forEach(function (chip) {
      if (chip.dataset.bound) {
        return;
      }

      chip.dataset.bound = "true";
      chip.addEventListener("click", function () {
        state.specialty = chip.dataset.specialty || "All";
        applyFilters(body);
      });
    });
  }

  function cleanup() {
    var body = document.querySelector(BODY_SELECTOR);

    if (!body) {
      return;
    }

    body.__landingMutating = true;
    body.classList.remove("landing-dashboard-body");

    Array.prototype.slice.call(body.querySelectorAll(".landing-home-hero, .landing-toolbar, .landing-empty-state")).forEach(
      function (node) {
        node.remove();
      }
    );

    Array.prototype.slice.call(body.querySelectorAll(".doctor-directory-grid")).forEach(function (row) {
      row.classList.remove("doctor-directory-grid");
    });

    Array.prototype.slice.call(body.querySelectorAll(".doctor-directory-card")).forEach(function (card) {
      card.classList.remove("doctor-directory-card");
      card.style.display = "";

      var accent = card.querySelector(".doctor-card-accent");
      if (accent) {
        accent.remove();
      }
    });

    var title = body.querySelector(".landing-section-title");
    if (title) {
      title.classList.remove("landing-section-title");
    }

    window.setTimeout(function () {
      body.__landingMutating = false;
    }, 0);
  }

  function cleanupLoginPage() {
    var container = document.querySelector(".form-container");

    if (!container) {
      return;
    }

    container.classList.remove("login-route-shell");

    Array.prototype.slice.call(container.querySelectorAll(".login-route-showcase")).forEach(function (node) {
      node.remove();
    });

    var form = container.querySelector(".registration-form");
    if (!form) {
      return;
    }

    form.classList.remove("login-route-panel");

    var heading = form.querySelector("h1, h2, h3, h4");
    if (heading) {
      heading.classList.remove("login-route-title");
    }

    var subtitle = form.querySelector(".login-route-subtitle");
    if (subtitle) {
      subtitle.remove();
    }

    Array.prototype.slice.call(form.querySelectorAll(".login-route-selector, .login-route-helper")).forEach(function (node) {
      node.remove();
    });

    var actions = form.querySelector(".auth-route-actions");
    if (actions) {
      while (actions.firstChild) {
        form.appendChild(actions.firstChild);
      }
      actions.remove();
    }

    Array.prototype.slice.call(form.querySelectorAll(".auth-route-link, .auth-route-button")).forEach(function (node) {
      node.classList.remove("auth-route-link");
      node.classList.remove("auth-route-button");
    });

    Array.prototype.slice.call(form.querySelectorAll(".login-route-legacy")).forEach(function (node) {
      node.classList.remove("login-route-legacy");
    });
  }

  function cleanupStandaloneAuthPage() {
    var root = document.getElementById("root");

    if (root && root.dataset.authPortal === "true" && !isStandaloneAuthRoute()) {
      root.innerHTML = "";
      delete root.dataset.authPortal;
      delete root.dataset.authPortalMode;
    }

    document.documentElement.classList.remove("auth-portal-html");
    if (document.body) {
      document.body.classList.remove("auth-portal-body");
    }
  }

  function renderLoginShowcase(container) {
    var showcase = container.querySelector(".login-route-showcase");

    if (!showcase) {
      showcase = document.createElement("section");
      showcase.className = "login-route-showcase";
      container.insertBefore(showcase, container.firstChild);
    }

    showcase.innerHTML =
      '<span class="login-route-kicker">Smart scheduling</span>' +
      "<h2>Appointments made easy for doctors and patients.</h2>" +
      "<p>Manage bookings, track schedules, and stay on top of healthcare updates from one simple appointment platform built for both doctors and users.</p>" +
      '<div class="login-route-points">' +
      '<div class="login-route-point"><i class="fa-solid fa-calendar-check"></i><span>Book, manage, and review appointments without extra steps.</span></div>' +
      '<div class="login-route-point"><i class="fa-solid fa-user-doctor"></i><span>Doctors and users each get a smoother sign-in path into the app.</span></div>' +
      '<div class="login-route-point"><i class="fa-solid fa-bell"></i><span>Stay updated with schedules, notifications, and activity in one place.</span></div>' +
      "</div>";
  }

  function ensureLoginRouteSelector(form) {
    var selector = form.querySelector(".login-route-selector");

    if (!selector) {
      selector = document.createElement("div");
      selector.className = "login-route-selector";
      selector.innerHTML =
        '<div class="login-role-grid">' +
        '<a class="login-role-card login-role-card--patient" href="' +
        PATIENT_LOGIN_PATH +
        '">' +
        '<span class="login-role-badge">Patient login</span>' +
        "<strong>Book care, review appointments, and manage your health journey.</strong>" +
        '<span class="login-role-copy">Continue to the patient portal</span>' +
        "</a>" +
        '<a class="login-role-card login-role-card--doctor" href="' +
        DOCTOR_LOGIN_PATH +
        '">' +
        '<span class="login-role-badge">Doctor login</span>' +
        "<strong>Use your approved doctor account to manage schedules and patients.</strong>" +
        '<span class="login-role-copy">Continue to the doctor portal</span>' +
        "</a>" +
        "</div>" +
        '<p class="login-route-helper">New here? <a href="/register">Create an account</a>, and if you are a doctor you can apply for doctor access from the dashboard after signing in.</p>';

      var subtitle = form.querySelector(".login-route-subtitle");
      if (subtitle) {
        subtitle.insertAdjacentElement("afterend", selector);
      } else {
        form.appendChild(selector);
      }
    }

    Array.prototype.slice.call(form.querySelectorAll(".ant-form-item, button[type=\"submit\"], a")).forEach(function (node) {
      if (!node.closest(".login-route-selector")) {
        node.classList.add("login-route-legacy");
      }
    });
  }

  function getStandaloneAuthContent(route) {
    if (route === "doctor") {
      return {
        shellClass: "auth-portal-shell--doctor",
        eyebrow: "Doctor portal",
        title: "Sign in as a doctor",
        description:
          "Use your approved doctor account to review appointments, manage your profile, and stay on top of patient activity from one focused workspace.",
        submitLabel: "Continue to doctor workspace",
        altHref: PATIENT_LOGIN_PATH,
        altLabel: "Open patient login",
        altText: "Not signing in as a doctor?",
        supportHref: "/login",
        supportLabel: "Back to portal selection",
        helperCopy: "Doctor access becomes available after your application has been approved.",
        note:
          "If you still need to apply as a doctor, sign in through the patient route first and submit your doctor request from the dashboard.",
        points:
          '<div class="auth-portal-point"><i class="fa-solid fa-calendar-check"></i><span>Review appointments and schedule changes quickly.</span></div>' +
          '<div class="auth-portal-point"><i class="fa-solid fa-file-waveform"></i><span>Keep your doctor profile current and easy for patients to discover.</span></div>' +
          '<div class="auth-portal-point"><i class="fa-solid fa-user-shield"></i><span>Only approved doctor accounts can continue through this portal.</span></div>',
      };
    }

    return {
      shellClass: "auth-portal-shell--patient",
      eyebrow: "Patient portal",
      title: "Sign in as a patient",
      description:
        "Access appointment booking, notifications, and doctor discovery from a calmer patient-first sign-in flow built for day-to-day care management.",
      submitLabel: "Continue to patient workspace",
      altHref: DOCTOR_LOGIN_PATH,
      altLabel: "Open doctor login",
      altText: "Signing in as a doctor instead?",
      supportHref: "/register",
      supportLabel: "Create an account",
      helperCopy: "Create a regular user account to start booking appointments and using the platform.",
      note:
        "Use this route for user access, including new people who want to register first and apply for doctor access later from inside the app.",
      points:
        '<div class="auth-portal-point"><i class="fa-solid fa-stethoscope"></i><span>Search specialists and compare care options with less friction.</span></div>' +
        '<div class="auth-portal-point"><i class="fa-solid fa-bell"></i><span>Track appointment updates, notifications, and responses in one place.</span></div>' +
        '<div class="auth-portal-point"><i class="fa-solid fa-heart-pulse"></i><span>Start as a patient if you plan to apply for doctor access later.</span></div>',
    };
  }

  function setStandaloneAuthMessage(form, type, text) {
    var messageNode = form && form.querySelector(".auth-portal-message");
    if (!messageNode) {
      return;
    }

    messageNode.className = "auth-portal-message" + (type ? " is-" + type : "");
    messageNode.textContent = text || "";
  }

  function bindStandaloneAuthForm(form, route) {
    if (!form || form.dataset.bound === "true") {
      return;
    }

    form.dataset.bound = "true";
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailInput = form.querySelector('input[name="email"]');
      var passwordInput = form.querySelector('input[name="password"]');
      var submitButton = form.querySelector('button[type="submit"]');
      var originalLabel = submitButton ? submitButton.textContent : "";
      var payload = {
        email: normalize(emailInput && emailInput.value),
        password: passwordInput ? passwordInput.value : "",
        role: route,
      };

      if (!payload.email || !payload.password) {
        setStandaloneAuthMessage(form, "error", "Please enter both your email and password.");
        return;
      }

      setStandaloneAuthMessage(form, "", "");

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";
      }

      window
        .fetch("/api/v1/user/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })
        .then(function (response) {
          return response.json().catch(function () {
            return {
              success: false,
              message: "We could not understand the login response. Please try again.",
            };
          });
        })
        .then(function (data) {
          if (data && data.success && data.token) {
            window.localStorage.setItem("token", data.token);
            setStandaloneAuthMessage(form, "success", "Login successful. Opening your dashboard...");
            window.location.replace("/");
            return;
          }

          setStandaloneAuthMessage(
            form,
            "error",
            (data && data.message) || "We could not sign you in right now. Please try again."
          );
        })
        .catch(function () {
          setStandaloneAuthMessage(form, "error", "Something went wrong while signing in. Please try again.");
        })
        .finally(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
          }
        });
    });
  }

  function enhanceStandaloneAuthPage(route) {
    var root = document.getElementById("root");
    var content = getStandaloneAuthContent(route);

    if (!root || !content) {
      return;
    }

    if (window.localStorage.getItem("token")) {
      window.location.replace("/");
      return;
    }

    document.documentElement.classList.add("auth-portal-html");
    if (document.body) {
      document.body.classList.add("auth-portal-body");
    }

    if (root.dataset.authPortalMode !== route) {
      root.innerHTML =
        '<div class="auth-portal-shell ' +
        content.shellClass +
        '">' +
        '<section class="auth-portal-showcase">' +
        '<span class="auth-portal-kicker">' +
        content.eyebrow +
        "</span>" +
        "<h1>" +
        content.title +
        "</h1>" +
        "<p>" +
        content.description +
        "</p>" +
        '<div class="auth-portal-points">' +
        content.points +
        "</div>" +
        '<p class="auth-portal-note">' +
        content.note +
        "</p>" +
        "</section>" +
        '<section class="auth-portal-card">' +
        '<a class="auth-portal-back" href="' +
        content.supportHref +
        '"><i class="fa-solid fa-arrow-left"></i><span>' +
        content.supportLabel +
        "</span></a>" +
        '<span class="auth-portal-card-badge">' +
        content.eyebrow +
        "</span>" +
        "<h2>" +
        content.title +
        "</h2>" +
        '<p class="auth-portal-card-copy">' +
        content.helperCopy +
        "</p>" +
        '<form class="auth-portal-form" novalidate>' +
        '<label class="auth-portal-field">' +
        "<span>Email</span>" +
        '<input type="email" name="email" autocomplete="email" placeholder="you@example.com" required />' +
        "</label>" +
        '<label class="auth-portal-field">' +
        "<span>Password</span>" +
        '<input type="password" name="password" autocomplete="current-password" placeholder="Enter your password" required />' +
        "</label>" +
        '<button class="auth-portal-submit" type="submit">' +
        content.submitLabel +
        "</button>" +
        '<p class="auth-portal-message" aria-live="polite"></p>' +
        "</form>" +
        '<div class="auth-portal-links">' +
        "<span>" +
        content.altText +
        "</span>" +
        '<a href="' +
        content.altHref +
        '">' +
        content.altLabel +
        "</a>" +
        "</div>" +
        "</section>" +
        "</div>";
      root.dataset.authPortal = "true";
      root.dataset.authPortalMode = route;
    }

    bindStandaloneAuthForm(root.querySelector(".auth-portal-form"), route);
  }

  function enhanceLoginPage() {
    if (!isLoginRoute()) {
      cleanupLoginPage();
      return;
    }

    var container = document.querySelector(".form-container");
    if (!container) {
      return;
    }

    var form = container.querySelector(".registration-form");
    if (!form) {
      return;
    }

    container.classList.add("login-route-shell");

    renderLoginShowcase(container);
    form.classList.add("login-route-panel");

    var heading = form.querySelector("h1, h2, h3, h4");
    if (heading) {
      heading.textContent = "Choose your login";
      heading.classList.add("login-route-title");

      if (!form.querySelector(".login-route-subtitle")) {
        var subtitle = document.createElement("p");
        subtitle.className = "login-route-subtitle";
        subtitle.textContent = "Sign in to manage appointments, schedules, and updates across the platform.";
        heading.insertAdjacentElement("afterend", subtitle);
      } else {
        form.querySelector(".login-route-subtitle").textContent =
          "Sign in to manage appointments, schedules, and updates across the platform.";
      }
    }

    ensureLoginRouteSelector(form);
  }

  function cleanupRegisterPage() {
    var container = document.querySelector(".form-container");

    if (!container) {
      return;
    }

    container.classList.remove("register-route-shell");

    Array.prototype.slice.call(container.querySelectorAll(".register-route-visual")).forEach(function (node) {
      node.remove();
    });

    var form = container.querySelector(".registration-form");
    if (!form) {
      return;
    }

    form.classList.remove("register-route-panel");

    var heading = form.querySelector("h1, h2, h3, h4");
    if (heading) {
      heading.classList.remove("register-route-title");
    }

    Array.prototype.slice.call(form.querySelectorAll(".register-route-subtitle")).forEach(function (node) {
      node.remove();
    });
  }

  function renderRegisterShowcase(container) {
    var showcase = container.querySelector(".register-route-visual");

    if (!showcase) {
      showcase = document.createElement("section");
      showcase.className = "register-route-visual";
      container.insertBefore(showcase, container.firstChild);
    }

    showcase.innerHTML =
      '<span class="register-route-kicker">Create account</span>' +
      "<h2>Start your care journey with a brighter first step.</h2>" +
      "<p>Create your account to explore doctors, book appointments, and stay connected with your healthcare updates in one reassuring place.</p>" +
      '<div class="register-route-highlights">' +
      '<div class="register-route-highlight"><i class="fa-solid fa-hospital"></i><span>Built around a welcoming hospital-inspired atmosphere.</span></div>' +
      '<div class="register-route-highlight"><i class="fa-solid fa-user-doctor"></i><span>Find specialists and apply for doctor access later if needed.</span></div>' +
      '<div class="register-route-highlight"><i class="fa-solid fa-heart-circle-check"></i><span>Simple account setup so users can get to care faster.</span></div>' +
      "</div>";
  }

  function enhanceRegisterPage() {
    if (!isRegisterRoute()) {
      cleanupRegisterPage();
      return;
    }

    var container = document.querySelector(".form-container");
    if (!container) {
      return;
    }

    var form = container.querySelector(".registration-form");
    if (!form) {
      return;
    }

    container.classList.add("register-route-shell");
    renderRegisterShowcase(container);
    form.classList.add("register-route-panel");

    var heading = form.querySelector("h1, h2, h3, h4");
    if (heading) {
      heading.textContent = "Create your account";
      heading.classList.add("register-route-title");

      if (!form.querySelector(".register-route-subtitle")) {
        var subtitle = document.createElement("p");
        subtitle.className = "register-route-subtitle";
        subtitle.textContent =
          "Join the platform to book consultations, manage appointments, and access a calm healthcare workspace.";
        heading.insertAdjacentElement("afterend", subtitle);
      } else {
        form.querySelector(".register-route-subtitle").textContent =
          "Join the platform to book consultations, manage appointments, and access a calm healthcare workspace.";
      }
    }
  }

  function enhanceAuthRoutes() {
    if (isStandaloneAuthRoute()) {
      cleanupLoginPage();
      cleanupRegisterPage();
      enhanceStandaloneAuthPage(getAuthRoute());
      return;
    }

    cleanupStandaloneAuthPage();
    enhanceLoginPage();
    enhanceRegisterPage();
  }

  function enhanceHomePage() {
    if (!isHomeRoute()) {
      cleanup();
      return;
    }

    var body = document.querySelector(BODY_SELECTOR);
    if (!body) {
      return;
    }

    if (!body.__landingObserver) {
      body.__landingObserver = new MutationObserver(function () {
        if (body.__landingMutating) {
          return;
        }
        scheduleEnhancement();
      });
      body.__landingObserver.observe(body, { childList: true, subtree: true });
    }

    var title = body.querySelector(TITLE_SELECTOR);
    var row = body.querySelector(GRID_SELECTOR);

    if (!title || !row) {
      return;
    }

    body.classList.add("landing-dashboard-body");
    body.__landingMutating = true;

    var cards = collectCards(body);
    var metrics = getMetrics(cards);
    var state = getState(body);

    var hero = body.querySelector(".landing-home-hero");
    if (hero) {
      hero.remove();
    }

    var toolbar = body.querySelector(".landing-toolbar");
    if (toolbar) {
      toolbar.remove();
    }

    createHero(body, metrics);
    createToolbar(body, title, row, metrics, state);
    styleCards(cards);
    wireInteractions(body);
    applyFilters(body);

    window.setTimeout(function () {
      body.__landingMutating = false;
    }, 0);
  }

  function scheduleEnhancement() {
    window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(function () {
      enhanceHomePage();
      enhanceAuthRoutes();
    }, 60);
  }

  function onRouteChange() {
    window.clearTimeout(routeTimer);
    routeTimer = window.setTimeout(function () {
      scheduleEnhancement();
    }, 80);
  }

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(history, arguments);
    onRouteChange();
  };

  history.replaceState = function () {
    originalReplaceState.apply(history, arguments);
    onRouteChange();
  };

  window.addEventListener("popstate", onRouteChange);
  window.addEventListener("load", scheduleEnhancement);
  document.addEventListener("DOMContentLoaded", scheduleEnhancement);
  scheduleEnhancement();
})();
