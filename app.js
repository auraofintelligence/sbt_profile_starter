const storageKey = "minjerribahProfile";

const steps = [
  {
    key: "step1",
    title: "Foundations",
    theme: "Grounding",
    fields: [
            ["Where are you living, staying, or based?", "township"],
            ["Public connection keywords", "roots"],
            ["Connection to Minjerribah", "connection"],
    ],
  },
  {
    key: "step2",
    title: "Passions",
    theme: "Creative & Emotional",
    fields: [
      ["Ideas, projects, or improvements you would like to see", "projects"],
      ["Ongoing gripes or unsolved local problems", "energy"],
      ["What you would put energy into, or already do", "threads"],
    ],
  },
  {
    key: "step3",
    title: "Capabilities",
    theme: "Personal Power",
    fields: [
      ["Practical skills, services, tools, or experience", "skills"],
      ["Availability, paid services, or support you can realistically offer", "time"],
      ["Local knowledge, resilience, or recovery experience", "knowledge"],
    ],
  },
  {
    key: "step4",
    title: "Care",
    theme: "Community & Compassion",
    fields: [
      ["How you support people or community, or how you would like to", "support"],
      ["Groups, clubs, family roles, or shared responsibilities", "caregiving"],
      ["How you care for Country, water, wildlife, and public places", "stewardship"],
    ],
  },
  {
    key: "step5",
    title: "Voice",
    theme: "Expression",
    fields: [
      ["A public story about who you are", "story"],
      ["A story about something you did to better yourself", "reference"],
      ["A story about helping someone or something else", "meaning"],
    ],
  },
  {
    key: "step6",
    title: "Vision",
    theme: "Foresight",
    fields: [
      ["A more joyful island future", "joyfulFuture"],
      ["A more responsible island future", "responsibleFuture"],
      ["A more abundant island future", "abundantFuture"],
    ],
  },
  {
    key: "step7",
    title: "Ecosystem",
    theme: "Connection to the Whole",
    fields: [
      ["Services, places, or infrastructure you rely on", "infrastructure"],
      ["People, groups, or networks you connect with", "networks"],
      ["How you would like to connect or contribute next", "whole"],
    ],
  },
];

function readProfile() {
  return JSON.parse(sessionStorage.getItem(storageKey) || "{}");
}

function writeProfile(profile) {
  sessionStorage.setItem(storageKey, JSON.stringify(profile));
}

function hydrateMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.addEventListener("click", (event) => {
    if (!event.target.closest("a, button")) return;
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

function clean(value) {
  return String(value || "").trim();
}

function hydrateStepForm() {
  const form = document.querySelector("[data-step-form]");
  if (!form) return;

  const stepKey = form.dataset.stepForm;
  const profile = readProfile();
  const existingStep = profile[stepKey] || {};

  for (const element of form.elements) {
    if (element.name && existingStep[element.name]) {
      element.value = existingStep[element.name];
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextPage = form.dataset.nextPage || "step8.html";
    const nextProfile = readProfile();
    nextProfile[stepKey] = Object.fromEntries(new FormData(form).entries());
    nextProfile.updatedAt = new Date().toISOString();
    writeProfile(nextProfile);

    window.location.href = nextPage;
  });
}

function hydrateDeleteAllButtons() {
  const buttons = document.querySelectorAll("[data-delete-all]");
  if (!buttons.length) return;

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const confirmed = window.confirm(
        "Delete all answers from this browser session? This cannot be undone."
      );

      if (!confirmed) return;

      sessionStorage.removeItem(storageKey);

      const form = document.querySelector("[data-step-form]");
      if (form) form.reset();

      const output = document.querySelector("#markdownOutput");
      if (output) output.value = buildMarkdown({});

      const status = document.querySelector("#status");
      if (status) status.textContent = "All saved answers have been deleted.";
    });
  }
}

function getValue(profile, stepKey, fieldKey) {
  const value = clean(profile[stepKey] && profile[stepKey][fieldKey]);
  return value || "_No response provided._";
}

function markdownSection(profile, step) {
  const lines = [`## ${step.title} (${step.theme})`, ""];

  for (const [label, fieldKey] of step.fields) {
    lines.push(`### ${label}`);
    lines.push(getValue(profile, step.key, fieldKey));
    lines.push("");
  }

  return lines.join("\n");
}

function buildMarkdown(profile) {
  const township = getValue(profile, "step1", "township").replace(/_/g, "");
  const generatedDate = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return [
    "# Minjerribah Local Civic Profile",
    "",
    `**Place name:** ${township || "No response provided."}`,
    `**Generated:** ${generatedDate}`,
    "",
    "This profile is a locally held civic record for community connection, practical contribution, public accountability, and neighbourhood memory.",
    "",
    ...steps.map((step) => markdownSection(profile, step)),
    "---",
    "",
    "Created with the Local Profile Builder for Minjerribah.",
    "",
    "[Strange But True](https://auraofintelligence.github.io/strange-but-true/index.html)",
    "",
  ].join("\n");
}

function hydrateOutputPage() {
  const output = document.querySelector("#markdownOutput");
  if (!output) return;

  const status = document.querySelector("#status");
  const downloadButton = document.querySelector("#downloadButton");
  const copyButton = document.querySelector("#copyButton");
  const profile = readProfile();

  function setStatus(message) {
    status.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      status.textContent = "";
    }, 2800);
  }

  output.value = buildMarkdown(profile);

  output.addEventListener("input", () => {
    const nextProfile = readProfile();
    nextProfile.manualMarkdown = output.value;
    writeProfile(nextProfile);
  });

  downloadButton.addEventListener("click", () => {
    const blob = new Blob([output.value], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "profile.md";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("profile.md is ready.");
  });

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      setStatus("Profile text copied.");
    } catch (error) {
      output.select();
      document.execCommand("copy");
      setStatus("Profile text copied.");
    }
  });
}

hydrateMobileNav();
hydrateStepForm();
hydrateOutputPage();
hydrateDeleteAllButtons();
