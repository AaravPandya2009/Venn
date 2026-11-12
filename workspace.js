(() => {
  const sections = [...document.querySelectorAll('.planner > .night-details')];
  sections.forEach((section, i) => {
    const destination = document.querySelector(i ? '#privacy-content' : '#friends-content');
    [...section.children].filter(child => child.tagName !== 'SUMMARY').forEach(child => destination.append(child));
    section.remove();
  });
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = [...document.querySelectorAll('.view-panel')];
  const mobile = matchMedia('(max-width: 760px)');
  const orient = () => document.querySelector('[role="tablist"]').setAttribute('aria-orientation', mobile.matches ? 'horizontal' : 'vertical');
  orient(); mobile.addEventListener('change', orient);
  let calendarPositioned = false;
  function route() {
    const name = location.hash.slice(1);
    const current = tabs.find(tab => tab.hash === '#' + name) || tabs[0];
    if (current.hash !== location.hash) history.replaceState(null, '', current.hash);
    tabs.forEach(tab => {const selected = tab === current; tab.setAttribute('aria-selected', selected); tab.tabIndex = selected ? 0 : -1;});
    panels.forEach(panel => panel.hidden = panel.id !== current.getAttribute('aria-controls'));
    if (document.activeElement.closest('[hidden]')) current.focus();
    document.title = current.querySelector('span').textContent + ' · Venn';
    window.scrollTo(0, 0);
    if (current.hash === '#schedule' && !calendarPositioned) requestAnimationFrame(() => {
      const slot = document.querySelector('[data-key="0-16"]');
      const scroller = document.querySelector('.calendar-scroll');
      if (slot) scroller.scrollTop = slot.offsetTop - scroller.querySelector('.calendar').offsetTop - 38;
      calendarPositioned = true;
    });
  }
  tabs.forEach((tab, index) => tab.addEventListener('keydown', event => {
    const previous = mobile.matches ? 'ArrowLeft' : 'ArrowUp';
    const next = mobile.matches ? 'ArrowRight' : 'ArrowDown';
    let target;
    if (event.key === previous) target = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === next) target = tabs[(index + 1) % tabs.length];
    if (event.key === 'Home') target = tabs[0];
    if (event.key === 'End') target = tabs[tabs.length - 1];
    if (event.key === ' ') target = tab;
    if (target) {event.preventDefault(); target.focus(); location.hash = target.hash;}
  }));
  document.querySelector('.skip-link').onclick = event => {event.preventDefault(); document.querySelector('#workspace-main').focus();};
  window.addEventListener('hashchange', route);
  route();
})();
