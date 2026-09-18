document.querySelectorAll('.scard[data-service-index]').forEach(function(card){
  card.addEventListener('click', function(){
    var idx = parseInt(card.getAttribute('data-service-index'), 10);
    if(typeof window.goToBookingWithService === 'function'){
      window.goToBookingWithService(idx);
    }
  });
  card.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); card.click(); }
  });
});