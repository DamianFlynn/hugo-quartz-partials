const removeMarkdown = (
  markdown,
  options = {
    listUnicodeChar: false,
    stripListLeaders: true,
    gfm: true,
    useImgAltText: false,
    preserveLinks: false,
  },
) => {
  let output = markdown || ""
  output = output.replace(/^(-\s*?|\*\s*?|_\s*?){3,}\s*$/gm, "")

  try {
    if (options.stripListLeaders) {
      if (options.listUnicodeChar)
        output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, options.listUnicodeChar + " $1")
      else output = output.replace(/^([\s\t]*)([\*\-\+]|\d+\.)\s+/gm, "$1")
    }
    if (options.gfm) {
      output = output
        .replace(/\n={2,}/g, "\n")
        .replace(/~{3}.*\n/g, "")
        .replace(/~~/g, "")
        .replace(/`{3}.*\n/g, "")
    }
    if (options.preserveLinks) {
      output = output.replace(/\[(.*?)\][\[\(](.*?)[\]\)]/g, "$1 ($2)")
    }
    output = output
      .replace(/<[^>]*>/g, "")
      .replace(/^[=\-]{2,}\s*$/g, "")
      .replace(/\[\^.+?\](\: .*?$)?/g, "")
      .replace(/(#{1,6})\s+(.+)\1?/g, "<b>$2</b>")
      .replace(/\s{0,2}\[.*?\]: .*?$/g, "")
      .replace(/\!\[(.*?)\][\[\(].*?[\]\)]/g, options.useImgAltText ? "$1" : "")
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, "<a>$1</a>")
      .replace(/!?\[\[\S[^\[\]\|]*(?:\|([^\[\]]*))?\S\]\]/g, "<a>$1</a>")
      .replace(/^\s{0,3}>\s?/g, "")
      .replace(/(^|\n)\s{0,3}>\s?/g, "\n\n")
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, "")
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
      .replace(/([\*_]{1,3})(\S.*?\S{0,1})\1/g, "$2")
      .replace(/(`{3,})(.*?)\1/gm, "$2")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\n{2,}/g, "\n\n")
      .replace(/\[![a-zA-Z]+\][-\+]? /g, "")
  } catch (e) {
    console.error(e)
    return markdown
  }
  return output
}

function htmlToElement(html) {
  const template = document.createElement("template")
  html = html.trim()
  template.innerHTML = html
  return template.content.firstChild
}

function initPopover(baseURL, useContextualBacklinks, renderLatex) {
  const basePath = baseURL.replace(window.location.origin, "")
  fetchData.then(({ content }) => {
    const links = [...document.getElementsByClassName("internal-link")]
    links
      .filter(li => li.dataset.src || (li.dataset.idx && useContextualBacklinks))
      .forEach(li => {
        var el
        if (li.dataset.ctx) {
          const linkDest = content[li.dataset.src]
          const popoverElement = `<div class="popover">
    <h3>${linkDest.title}</h3>
    <p>${highlight(removeMarkdown(linkDest.content), li.dataset.ctx)}...</p>
    <p class="meta">${new Date(linkDest.lastmodified).toLocaleDateString()}</p>
</div>`
          el = htmlToElement(popoverElement)
        } else {
          const linkDest = content[li.dataset.src.replace(/\/$/g, "").replace(basePath, "")]
          if (linkDest) {
            let splitLink = li.href.split("#")
            let cleanedContent = removeMarkdown(linkDest.content)
            if (splitLink.length > 1) {
              let headingName = decodeURIComponent(splitLink[1]).replace(/\-/g, " ")
              let headingIndex = cleanedContent.toLowerCase().indexOf("<b>" + headingName + "</b>")
              cleanedContent = cleanedContent.substring(headingIndex, cleanedContent.length)
            }
            const popoverElement = `<div class="popover">
    <h3>${linkDest.title}</h3>
    <p>${cleanedContent.split(" ", 70).join(" ")}...</p>
    <p class="meta">Last Modified: ${new Date(linkDest.lastmodified).toLocaleDateString()}</p>
</div>`
            el = htmlToElement(popoverElement)
          }
        }

        if (el) {
          li.appendChild(el)
          if (renderLatex) {
            renderMathInElement(el, {
              delimiters: [
                { left: '$$', right: '$$', display: false },
                { left: '$', right: '$', display: false },
              ],
              throwOnError: false
            })
          }

          li.addEventListener("mouseover", () => {
            // fix tooltip positioning
            window.FloatingUIDOM.computePosition(li, el, {
              middleware: [window.FloatingUIDOM.offset(10), window.FloatingUIDOM.inline(), window.FloatingUIDOM.shift()],
            }).then(({ x, y }) => {
              Object.assign(el.style, {
                left: `${x}px`,
                top: `${y}px`,
              })
            })

            el.classList.add("visible")
          })
          li.addEventListener("mouseout", () => {
            el.classList.remove("visible")
          })
        }
      })
  })
}
