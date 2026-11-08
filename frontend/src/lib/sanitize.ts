export function sanitizeHtml(html: string) {
  if (typeof window === "undefined") return "";

  const allowedTags = new Set(["H2", "H3", "P", "UL", "OL", "LI", "STRONG", "EM", "BR"]);
  const documentFragment = new DOMParser().parseFromString(html, "text/html");

  documentFragment.body.querySelectorAll("*").forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name));
  });

  return documentFragment.body.innerHTML;
}
