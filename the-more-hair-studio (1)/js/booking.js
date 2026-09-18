(function(){
  var HOURS = {
    0: [8.5, 20.0],  // Sunday
    1: [8.5, 20.5],  // Monday
    2: null,          // Tuesday - closed
    3: [8.5, 20.5],  // Wednesday
    4: [8.5, 20.5],  // Thursday
    5: [8.5, 20.5],  // Friday
    6: [8.5, 20.0]   // Saturday
  };
  var STAFF_PHONE = {
    'Mehmet Can Duygu': '905369559309',
    'Serkan İlgin': '905447652523',
    'Farketmez': '905369559309'
  };
  var ADDRESS = 'Viranşehir, 34324. Sk. No:19, Mezitli, 33340 Mersin';

  var wizard = document.getElementById('stepper');
  if(!wizard) return;

  var state = {
    step: 1,
    service: null, serviceLabel: '', duration: 45,
    staff: 'Farketmez', staffLabel: '',
    calYear: null, calMonth: null,
    date: null, time: null,
    name: '', phone: '', note: ''
  };

  var today = new Date();
  today.setHours(0,0,0,0);
  state.calYear = today.getFullYear();
  state.calMonth = today.getMonth();

  function t(key){
    var lang = window.currentLang || 'tr';
    return (window.I18N[lang] && window.I18N[lang][key]) || (window.I18N.tr[key]) || key;
  }
  function dayName(idx){
    var keys = ['day_sun','day_mon','day_tue','day_wed','day_thu','day_fri','day_sat'];
    return t(keys[idx]);
  }
  function dowShort(idx){
    var keys = ['dow_sun','dow_mon','dow_tue','dow_wed','dow_thu','dow_fri','dow_sat'];
    return t(keys[idx]);
  }
  function monthName(idx){
    var keys = ['mon_jan','mon_feb','mon_mar','mon_apr','mon_may','mon_jun','mon_jul','mon_aug','mon_sep','mon_oct','mon_nov','mon_dec'];
    return t(keys[idx]);
  }
  function pad(n){ return (n < 10 ? '0' : '') + n; }

  // ---------- Stepper navigation ----------
  function showStep(n){
    state.step = n;
    document.querySelectorAll('.step-panel').forEach(function(p){
      p.classList.toggle('active', parseInt(p.getAttribute('data-panel'),10) === n);
    });
    document.querySelectorAll('.step-item').forEach(function(s){
      var sn = parseInt(s.getAttribute('data-step'),10);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
    if(n === 5){ renderSummary(); }
    document.querySelector('.booking-panel').scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  document.querySelectorAll('[data-next]').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(btn.disabled) return;
      showStep(Math.min(5, state.step + 1));
    });
  });
  document.querySelectorAll('[data-back]').forEach(function(btn){
    btn.addEventListener('click', function(){
      showStep(Math.max(1, state.step - 1));
    });
  });

  // ---------- Step 1: service ----------
  var serviceCards = document.querySelectorAll('#serviceCards .option-card');
  var step1Next = document.querySelector('[data-panel="1"] [data-next]');
  serviceCards.forEach(function(card){
    card.addEventListener('click', function(){
      serviceCards.forEach(function(c){ c.classList.remove('selected'); });
      card.classList.add('selected');
      state.service = card.getAttribute('data-value');
      state.duration = parseInt(card.getAttribute('data-duration'), 10);
      state.serviceLabel = card.querySelector('b').textContent;
      step1Next.disabled = false;
    });
  });

  // ---------- Step 2: staff ----------
  var staffCards = document.querySelectorAll('#staffCards .option-card');
  staffCards.forEach(function(card){
    card.addEventListener('click', function(){
      staffCards.forEach(function(c){ c.classList.remove('selected'); });
      card.classList.add('selected');
      state.staff = card.getAttribute('data-value');
      state.staffLabel = card.querySelector('b').textContent;
    });
    if(card.classList.contains('selected')){
      state.staff = card.getAttribute('data-value');
      state.staffLabel = card.querySelector('b').textContent;
    }
  });

  // ---------- Step 3: calendar + slots ----------
  var calGrid = document.getElementById('calGrid');
  var calMonthLabel = document.getElementById('calMonthLabel');
  var slotsWrap = document.getElementById('slotsWrap');
  var slotsTitle = document.getElementById('slotsTitle');
  var slotsGrid = document.getElementById('slotsGrid');
  var hint = document.getElementById('bfHint');
  var step3Next = document.querySelector('[data-panel="3"] [data-next]');

  function dayHoursFor(dateObj){
    return HOURS[dateObj.getDay()];
  }

  function renderCalendar(){
    calMonthLabel.textContent = monthName(state.calMonth) + ' ' + state.calYear;
    calGrid.innerHTML = '';
    for(var d = 0; d < 7; d++){
      var dow = document.createElement('div');
      dow.className = 'cal-dow';
      dow.textContent = dowShort(d);
      calGrid.appendChild(dow);
    }
    var firstOfMonth = new Date(state.calYear, state.calMonth, 1);
    var startOffset = firstOfMonth.getDay();
    var daysInMonth = new Date(state.calYear, state.calMonth + 1, 0).getDate();
    for(var i = 0; i < startOffset; i++){
      var empty = document.createElement('div');
      empty.className = 'cal-day empty';
      calGrid.appendChild(empty);
    }
    for(var day = 1; day <= daysInMonth; day++){
      var cell = document.createElement('div');
      cell.className = 'cal-day';
      cell.textContent = day;
      var cellDate = new Date(state.calYear, state.calMonth, day);
      var isPast = cellDate < today;
      var closed = !dayHoursFor(cellDate);
      if(isPast || closed){
        cell.classList.add('disabled');
      } else {
        cell.addEventListener('click', function(dt, el){
          return function(){
            document.querySelectorAll('.cal-day.selected').forEach(function(c){ c.classList.remove('selected'); });
            el.classList.add('selected');
            state.date = dt;
            state.time = null;
            step3Next.disabled = true;
            renderSlots();
          };
        }(cellDate, cell));
      }
      if(state.date && cellDate.getTime() === state.date.getTime()){
        cell.classList.add('selected');
      }
      calGrid.appendChild(cell);
    }
  }

  function formatHour(hDecimal){
    var h = Math.floor(hDecimal);
    var m = Math.round((hDecimal - h) * 60);
    return pad(h) + ':' + pad(m);
  }

  function renderSlots(){
    if(!state.date){ slotsWrap.style.display = 'none'; return; }
    var dh = dayHoursFor(state.date);
    slotsGrid.innerHTML = '';
    hint.textContent = '';
    if(!dh){
      slotsWrap.style.display = 'none';
      hint.textContent = t('closed_hint');
      return;
    }
    var end = dh[1] - (state.duration / 60);
    if(end < dh[0]){
      slotsWrap.style.display = 'none';
      hint.textContent = t('too_long_hint');
      return;
    }
    slotsTitle.textContent = state.date.getDate() + ' ' + dayName(state.date.getDay()) + ' — ' + t('available_slots');
    for(var hVal = dh[0]; hVal <= end + 1e-9; hVal += 0.5){
      (function(hourVal){
        var timeStr = formatHour(hourVal);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'slot-btn';
        btn.textContent = timeStr;
        if(state.time === timeStr){ btn.classList.add('selected'); }
        btn.addEventListener('click', function(){
          document.querySelectorAll('.slot-btn.selected').forEach(function(b){ b.classList.remove('selected'); });
          btn.classList.add('selected');
          state.time = timeStr;
          step3Next.disabled = false;
        });
        slotsGrid.appendChild(btn);
      })(hVal);
    }
    slotsWrap.style.display = 'block';
  }

  document.getElementById('calPrev').addEventListener('click', function(){
    state.calMonth--;
    if(state.calMonth < 0){ state.calMonth = 11; state.calYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', function(){
    state.calMonth++;
    if(state.calMonth > 11){ state.calMonth = 0; state.calYear++; }
    renderCalendar();
  });

  renderCalendar();

  // ---------- Step 4: details ----------
  var nameInput = document.getElementById('bfName');
  var phoneInput = document.getElementById('bfPhone');
  var noteInput = document.getElementById('bfNote');
  var step4Next = document.querySelector('[data-panel="4"] [data-next]');
  function checkDetails(){
    step4Next.disabled = !(nameInput.value.trim() && phoneInput.value.trim());
  }
  nameInput.addEventListener('input', checkDetails);
  phoneInput.addEventListener('input', checkDetails);

  // ---------- Step 5: summary + ICS + WhatsApp ----------
  var summaryLines = document.getElementById('summaryLines');
  var icsLink = document.getElementById('bfIcs');
  var waLink = document.getElementById('bfWhatsapp');

  function icsDateTime(dateObj, timeStr){
    var parts = timeStr.split(':');
    return dateObj.getFullYear() + pad(dateObj.getMonth()+1) + pad(dateObj.getDate()) + 'T' + pad(parseInt(parts[0],10)) + pad(parseInt(parts[1],10)) + '00';
  }
  function addMinutesToTime(timeStr, minutes){
    var parts = timeStr.split(':');
    var d = new Date(2000,0,1, parseInt(parts[0],10), parseInt(parts[1],10));
    d.setMinutes(d.getMinutes() + minutes);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function renderSummary(){
    state.name = nameInput.value.trim();
    state.phone = phoneInput.value.trim();
    state.note = noteInput.value.trim();

    var dateLabel = state.date ? (state.date.getDate() + ' ' + monthName(state.date.getMonth()) + ' ' + state.date.getFullYear() + ' — ' + dayName(state.date.getDay())) : '';

    var rows = [
      [t('label_service'), state.serviceLabel],
      [t('label_staff'), state.staffLabel],
      [t('label_date'), dateLabel],
      [t('label_time'), state.time],
      [t('label_name'), state.name],
      [t('label_phone'), state.phone]
    ];
    if(state.note){ rows.push([t('label_note'), state.note]); }

    summaryLines.innerHTML = rows.map(function(r){
      return '<div class="summary-row"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join('');

    var endTime = addMinutesToTime(state.time, state.duration);
    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The More Hair Studio//Randevu//TR',
      'BEGIN:VEVENT',
      'DTSTART:' + icsDateTime(state.date, state.time),
      'DTEND:' + icsDateTime(state.date, endTime),
      'SUMMARY:' + state.serviceLabel + ' - The More Hair Studio',
      'DESCRIPTION:' + t('wa_staff') + ' ' + state.staffLabel + '\\n' + t('wa_name') + ' ' + state.name + '\\n' + t('wa_phone') + ' ' + state.phone + (state.note ? ('\\n' + t('wa_note') + ' ' + state.note) : ''),
      'LOCATION:' + ADDRESS,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    var blob = new Blob([ics], {type: 'text/calendar'});
    icsLink.href = URL.createObjectURL(blob);

    var waText = encodeURIComponent(t('wa_greeting')) + '%0A' +
      encodeURIComponent(t('wa_service')) + ' ' + encodeURIComponent(state.serviceLabel) + '%0A' +
      encodeURIComponent(t('wa_staff')) + ' ' + encodeURIComponent(state.staffLabel) + '%0A' +
      encodeURIComponent(t('wa_date')) + ' ' + encodeURIComponent(dateLabel + ' ' + state.time) + '%0A' +
      encodeURIComponent(t('wa_name')) + ' ' + encodeURIComponent(state.name) + '%0A' +
      encodeURIComponent(t('wa_phone')) + ' ' + encodeURIComponent(state.phone) +
      (state.note ? ('%0A' + encodeURIComponent(t('wa_note')) + ' ' + encodeURIComponent(state.note)) : '');
    var waNumber = STAFF_PHONE[state.staff] || STAFF_PHONE['Farketmez'];
    waLink.href = 'https://wa.me/' + waNumber + '?text=' + waText;
  }

  window.onLanguageChanged = function(){
    renderCalendar();
    renderSlots();
    if(state.step === 5){ renderSummary(); }
  };

  // ---------- Expose hook for homepage service cards ----------
  window.goToBookingWithService = function(index){
    showStep(1);
    var card = serviceCards[index];
    if(card){ card.click(); }
    document.getElementById('randevu').scrollIntoView({behavior:'smooth', block:'start'});
  };
})();