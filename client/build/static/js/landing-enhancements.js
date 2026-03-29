(function () {
  var HOME_PATH = "/";
  var LOGIN_PATH = "/login";
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
  }

  function createLoginShowcase(container) {
    var showcase = document.createElement("section");
    showcase.className = "login-route-showcase";
    showcase.innerHTML =
      '<span class="login-route-kicker">Welcome back</span>' +
      "<h2>Appointments, doctors, and updates in one calm workspace.</h2>" +
      "<p>Sign in to continue booking consultations, reviewing schedules, and tracking notifications without extra steps.</p>" +
      '<div class="login-route-points">' +
      '<div class="login-route-point"><i class="fa-solid fa-stethoscope"></i><span>Browse specialists by expertise and availability.</span></div>' +
      '<div class="login-route-point"><i class="fa-solid fa-calendar-check"></i><span>Manage bookings and appointments from one dashboard.</span></div>' +
      '<div class="login-route-point"><i class="fa-solid fa-bell"></i><span>Stay on top of approvals and doctor responses quickly.</span></div>' +
      "</div>";
    container.insertBefore(showcase, container.firstChild);
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

    if (!container.querySelector(".login-route-showcase")) {
      createLoginShowcase(container);
    }

    form.classList.add("login-route-panel");

    var heading = form.querySelector("h1, h2, h3, h4");
    if (heading) {
      heading.textContent = "Sign in";
      heading.classList.add("login-route-title");

      if (!form.querySelector(".login-route-subtitle")) {
        var subtitle = document.createElement("p");
        subtitle.className = "login-route-subtitle";
        subtitle.textContent = "Use your email and password to access your doctor booking dashboard.";
        heading.insertAdjacentElement("afterend", subtitle);
      }
    }

    var link = form.querySelector('a[href="/register"]');
    var button = form.querySelector('button[type="submit"]');

    if (link) {
      link.classList.add("auth-route-link");
    }

    if (button) {
      button.classList.add("auth-route-button");
    }

    if (link && button && !form.querySelector(".auth-route-actions")) {
      var actions = document.createElement("div");
      actions.className = "auth-route-actions";
      link.insertAdjacentElement("beforebegin", actions);
      actions.appendChild(link);
      actions.appendChild(button);
    }
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
      enhanceLoginPage();
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
