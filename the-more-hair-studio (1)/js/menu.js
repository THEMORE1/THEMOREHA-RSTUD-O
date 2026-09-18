(function(){
  var btn = document.getElementById('menuBtn');
  var links = document.getElementById('navLinks');
  function close(){
    links.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  }
  btn.addEventListener('click', function(){
    var isOpen = links.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', close);
  });
})();