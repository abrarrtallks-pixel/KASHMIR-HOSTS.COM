/* ================================================================
   KASHMIRHOSTS  main.js  v4.0
   Pure vanilla JS — no ES modules, no imports
   Firebase loaded via CDN scripts in each HTML page
   ================================================================ */

/* ─── HELPERS ───────────────────────────────────────────── */
function qs(sel, ctx){ return (ctx||document).querySelector(sel); }
function qsa(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }
function fmt(n){ return '₹' + Number(n).toLocaleString('en-IN'); }
function fmtD(val){
  if(!val) return 'N/A';
  try{
    var d = val && val.seconds ? new Date(val.seconds*1000) : new Date(val);
    return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  }catch(e){ return 'N/A'; }
}

/* ─── LOADER ─────────────────────────────────────────────── */
window.addEventListener('load', function(){
  setTimeout(function(){
    var el = document.getElementById('loader');
    if(el) el.classList.add('gone');
  }, 1800);
});

/* ─── NAVBAR ─────────────────────────────────────────────── */
(function(){
  var nav = qs('.nav');
  if(!nav) return;
  window.addEventListener('scroll', function(){
    nav.classList.toggle('solid', window.scrollY > 30);
  });
  var hbg = document.getElementById('hamburger');
  var mob = qs('.mob-menu');
  if(hbg && mob){
    hbg.addEventListener('click', function(e){
      e.stopPropagation();
      hbg.classList.toggle('open');
      mob.classList.toggle('open');
    });
    document.addEventListener('click', function(e){
      if(!hbg.contains(e.target) && !mob.contains(e.target)){
        hbg.classList.remove('open');
        mob.classList.remove('open');
      }
    });
  }
  // Active link
  var page = location.pathname.split('/').pop() || 'index.html';
  qsa('.nav-links a, .mob-menu a').forEach(function(a){
    if(a.getAttribute('href') === page) a.classList.add('act');
  });
})();

/* ─── SCROLL ANIMATIONS ──────────────────────────────────── */
function runAnims(){
  var els = qsa('.fu,.fll,.fr');
  if(!els.length) return;
  if('IntersectionObserver' in window){
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('vis'); obs.unobserve(e.target); }
      });
    },{threshold:0.1,rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el){ obs.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('vis'); });
  }
}
document.addEventListener('DOMContentLoaded', runAnims);

/* ─── TOAST ──────────────────────────────────────────────── */
function toast(msg, type, ms){
  type = type||'info'; ms = ms||3200;
  var box = document.getElementById('toasts');
  if(!box){ box = document.createElement('div'); box.id='toasts'; document.body.appendChild(box); }
  var icons = {info:'💬',ok:'✅',err:'❌',warn:'⚠️'};
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = '<span>'+(icons[type]||icons.info)+'</span><span>'+msg+'</span>';
  box.appendChild(t);
  setTimeout(function(){
    t.style.cssText='opacity:0;transform:translateX(22px);transition:all .4s';
    setTimeout(function(){ if(t.parentNode) t.remove(); }, 400);
  }, ms);
}

/* ─── CART ───────────────────────────────────────────────── */
var Cart = {
  get: function(){ try{ return JSON.parse(localStorage.getItem('kh_cart')||'[]'); }catch(e){ return []; } },
  save: function(items){ localStorage.setItem('kh_cart', JSON.stringify(items)); this.badge(); },
  add: function(item){
    var items = this.get();
    if(items.find(function(i){ return i.id===item.id; })){
      toast('Already in cart!','warn'); return;
    }
    items.push(item); this.save(items);
    toast('"'+item.name+'" added to cart!','ok');
  },
  remove: function(id){ this.save(this.get().filter(function(i){ return i.id!==id; })); },
  clear: function(){ localStorage.removeItem('kh_cart'); this.badge(); },
  total: function(){ return this.get().reduce(function(s,i){ return s+Number(i.price); },0); },
  count: function(){ return this.get().length; },
  badge: function(){
    var c = this.count();
    qsa('.cart-badge').forEach(function(b){ b.textContent=c; b.classList.toggle('on',c>0); });
  }
};
document.addEventListener('DOMContentLoaded', function(){ Cart.badge(); });

/* ─── AUTH HELPERS ───────────────────────────────────────── */
function getFirebaseAuth(){
  return (window.firebase && window.firebase.auth) ? window.firebase.auth() : null;
}
function getFirestore(){
  return (window.firebase && window.firebase.firestore) ? window.firebase.firestore() : null;
}

function updateNavUser(user){
  var area = document.getElementById('nav-user-area');
  if(!area) return;
  if(user){
    var name = user.displayName || user.email.split('@')[0];
    area.innerHTML =
      '<a href="dashboard.html" class="nbtn nbtn-ghost" style="display:flex;align-items:center;gap:6px">'+
      '<i class="fas fa-user-circle"></i> '+name.split(' ')[0]+'</a>'+
      '<button class="nbtn nbtn-y" onclick="doLogout()">Logout</button>';
  } else {
    area.innerHTML =
      '<a href="login.html" class="nbtn nbtn-ghost">Login</a>'+
      '<a href="book.html" class="nbtn nbtn-y">Book Now</a>';
  }
}

function doLogout(){
  var auth = getFirebaseAuth();
  if(auth){ auth.signOut(); }
  toast('Logged out','ok');
  setTimeout(function(){ location.href='index.html'; }, 800);
}

// Listen for auth state
document.addEventListener('DOMContentLoaded', function(){
  var auth = getFirebaseAuth();
  if(auth){
    auth.onAuthStateChanged(function(user){
      updateNavUser(user);
      if(user){
        var pending = localStorage.getItem('kh_cart_pending');
        if(pending){ try{ Cart.add(JSON.parse(pending)); }catch(e){} localStorage.removeItem('kh_cart_pending'); }
      }
    });
  } else {
    updateNavUser(null);
  }
});

function addToCart(id, name, price, type){
  var auth = getFirebaseAuth();
  var user = auth ? auth.currentUser : null;
  if(!user){
    localStorage.setItem('kh_cart_pending', JSON.stringify({id:id,name:name,price:price,type:type}));
    toast('Please login to add to cart','warn');
    setTimeout(function(){ location.href='login.html'; }, 1300);
    return;
  }
  Cart.add({id:id, name:name, price:price, type:type});
}

/* ─── DATA ───────────────────────────────────────────────── */
var TOURS = [
  {id:'t1',name:'Pahalgam Valley Escape',cat:'nature',label:'🌿 Nature',days:3,nights:2,price:8999,old:10999,
   img:'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=700&q=80',
   desc:'Explore Betaab Valley, Aru Valley, and Chandanwari — Valley of Shepherds.',
   rating:4.9,rev:312,inc:['Hotel','Meals','Transport','Guide'],
   itin:[{d:'Day 1',t:'Arrival & Betaab Valley',p:'Arrive Srinagar, transfer to Pahalgam. Visit Betaab Valley and Chandanwari. Evening by Lidder River.'},
         {d:'Day 2',t:'Aru Valley Trek',p:'Morning trek to Aru Valley. Picnic lunch amid pine forests. Evening bonfire.'},
         {d:'Day 3',t:'Baisaran & Departure',p:'Visit Baisaran meadow (Mini Switzerland). Transfer for departure.'}]},
  {id:'t2',name:'Gulmarg Snow Adventure',cat:'adventure',label:'⛷️ Adventure',days:4,nights:3,price:12499,old:15000,
   img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80',
   desc:'Cable car rides, skiing, and panoramic Himalayan views in Gulmarg.',
   rating:4.8,rev:289,inc:['Hotel','Breakfast','Gondola','Transport'],
   itin:[{d:'Day 1',t:'Srinagar Arrival',p:'Arrive Srinagar, check in. Evening Shikara ride on Dal Lake.'},
         {d:'Day 2',t:'Gulmarg Gondola',p:'Drive to Gulmarg. Phase 1 & 2 Gondola rides. Snow activities.'},
         {d:'Day 3',t:'Full Day Gulmarg',p:'Horse riding to Khilanmarg. Views of Nanga Parbat.'},
         {d:'Day 4',t:'Mughal Gardens',p:'Shalimar Bagh, Nishat Bagh. Departure.'}]},
  {id:'t3',name:'Dal Lake Houseboat Bliss',cat:'romance',label:'💑 Romance',days:2,nights:1,price:6499,old:7999,
   img:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80',
   desc:'Iconic Dal Lake shikara rides, floating gardens, and magical houseboat stay.',
   rating:4.9,rev:421,inc:['Houseboat','All Meals','Shikara','Guide'],
   itin:[{d:'Day 1',t:'Houseboat Arrival',p:'Check into heritage houseboat. Evening Shikara ride through floating gardens. Wazwan dinner.'},
         {d:'Day 2',t:'Srinagar Sightseeing',p:'Shikara to floating vegetable market. Hazratbal Shrine, Mughal Gardens. Departure.'}]},
  {id:'t4',name:'Sonamarg Golden Meadow',cat:'nature',label:'🌿 Nature',days:2,nights:1,price:5999,old:7500,
   img:'https://images.unsplash.com/photo-1591084728795-1149f32d9866?w=700&q=80',
   desc:'Trek to the magnificent Thajiwas Glacier and explore the Meadow of Gold.',
   rating:4.7,rev:198,inc:['Hotel','Meals','Transport','Guide'],
   itin:[{d:'Day 1',t:'Sonamarg Arrival',p:'Drive from Srinagar along Sindh River. Evening stroll.'},
         {d:'Day 2',t:'Thajiwas Glacier',p:'Trek/pony ride to Thajiwas Glacier. Lunch by the glacier. Return.'}]},
  {id:'t5',name:'Leh-Ladakh Explorer',cat:'adventure',label:'⛷️ Adventure',days:7,nights:6,price:22999,old:28000,
   img:'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80',
   desc:'Epic 7-day journey — Nubra Valley, Pangong Lake, Khardung La & monasteries.',
   rating:4.9,rev:156,inc:['Hotels','Meals','Innova Crysta','Permits','Guide'],
   itin:[{d:'Day 1',t:'Arrival Leh',p:'Arrive Leh. Rest for acclimatization. Evening Leh Market.'},
         {d:'Day 2',t:'Leh Sightseeing',p:'Shanti Stupa, Leh Palace, Hemis & Thiksey Monasteries.'},
         {d:'Day 3',t:'Nubra Valley',p:'Cross Khardung La (18,380 ft). Hunder sand dunes, Bactrian camels.'},
         {d:'Day 4',t:'Diskit',p:'Diskit Monastery with giant Maitreya Buddha.'},
         {d:'Day 5',t:'Pangong Lake',p:'Drive to Pangong Tso (14,270 ft). Sunset at the lake.'},
         {d:'Day 6',t:'Return Leh',p:'Sunrise at Pangong. Return via Chang La (17,585 ft).'},
         {d:'Day 7',t:'Departure',p:'Morning shopping. Transfer to airport.'}]},
  {id:'t6',name:'Kashmir Family Fiesta',cat:'family',label:'👨‍👩‍👧 Family',days:6,nights:5,price:18999,old:22000,
   img:'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=700&q=80',
   desc:'Perfect 6-day family package covering Srinagar, Pahalgam, Gulmarg & Sonamarg.',
   rating:4.8,rev:234,inc:['Hotels','All Meals','AC Innova','Guide','Activities'],
   itin:[{d:'Day 1',t:'Srinagar & Houseboat',p:'Arrive Srinagar. Houseboat check-in. Shikara ride.'},
         {d:'Day 2',t:'Srinagar Sightseeing',p:'Mughal Gardens, Shankaracharya Temple, local market.'},
         {d:'Day 3',t:'Pahalgam',p:'Betaab Valley, Aru Valley. Riverside picnic.'},
         {d:'Day 4',t:'Gulmarg Snow Fun',p:'Gondola ride, snow activities for kids.'},
         {d:'Day 5',t:'Sonamarg',p:'Day excursion. Glacier trek, pony ride for kids.'},
         {d:'Day 6',t:'Departure',p:'Breakfast, souvenir shopping. Airport transfer.'}]},
  {id:'t7',name:'Kashmir Honeymoon Special',cat:'romance',label:'💑 Romance',days:5,nights:4,price:16499,old:19000,
   img:'https://images.unsplash.com/photo-1569074187119-c87815b476da?w=700&q=80',
   desc:'Romantic journey — luxury houseboat, candlelit dinners, Pahalgam & Gulmarg.',
   rating:5.0,rev:187,inc:['Luxury Houseboat','Candlelit Dinner','Crysta','Flowers'],
   itin:[{d:'Day 1',t:'Romantic Welcome',p:'Arrive with floral welcome. Houseboat check-in. Sunset Shikara.'},
         {d:'Day 2',t:'Mughal Romance',p:'Shalimar Bagh, Nishat Bagh. Evening Polo View Market.'},
         {d:'Day 3',t:'Pahalgam Escape',p:'Betaab Valley. Evening by Lidder River.'},
         {d:'Day 4',t:'Gulmarg Snow Day',p:'Gondola ride. Couple photography. Romantic dinner.'},
         {d:'Day 5',t:'Farewell',p:'Morning leisure. Transfer to airport.'}]},
  {id:'t8',name:'Ladies Escape — Women Only',cat:'ladies',label:'🌸 Ladies Escape',days:4,nights:3,price:9999,old:12000,
   img:'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=700&q=80',
   desc:'A safe, curated Kashmir tour exclusively for groups of women. POSH-trained drivers & female guide available.',
   rating:5.0,rev:94,inc:['Hotel','Meals','Female Guide','Transport','24/7 Support'],
   itin:[{d:'Day 1',t:'Srinagar Arrival',p:'Arrive Srinagar. Check in hotel. Women-only Shikara ride. Welcome dinner.'},
         {d:'Day 2',t:'Srinagar Sightseeing',p:'Mughal Gardens, Hazratbal Shrine, local markets & shopping.'},
         {d:'Day 3',t:'Pahalgam Day Trip',p:'Betaab Valley, Aru Valley. Nature walk. Photography session.'},
         {d:'Day 4',t:'Sonamarg & Departure',p:'Sonamarg glacier excursion. Souvenir shopping. Departure.'}]},
  {id:'t9',name:'Solo Explorer — Kashmir',cat:'solo',label:'🎒 Solo',days:3,nights:2,price:7499,old:9000,
   img:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=700&q=80',
   desc:'Designed for solo travelers with group joining options and safety-first approach.',
   rating:4.8,rev:78,inc:['Hotel','Meals','Transport','Guide','Group Join Option'],
   itin:[{d:'Day 1',t:'Srinagar Arrival',p:'Arrive Srinagar. Check in. Evening Dal Lake walk.'},
         {d:'Day 2',t:'Gulmarg Day Trip',p:'Gondola ride. Snow activities. Return by evening.'},
         {d:'Day 3',t:'Pahalgam & Departure',p:'Betaab Valley morning visit. Afternoon departure.'}]},
  {id:'t10',name:'Amarnath Yatra Package',cat:'pilgrimage',label:'🕌 Pilgrimage',days:4,nights:3,price:11999,old:14000,
   img:'https://images.unsplash.com/photo-1591084728795-1149f32d9866?w=700&q=80',
   desc:'Sacred pilgrimage to Amarnath Cave Shrine with comfortable, safe arrangements.',
   rating:4.7,rev:145,inc:['Hotels','Meals','Transport','Ponies','Guide'],
   itin:[{d:'Day 1',t:'Jammu to Pahalgam',p:'Depart Jammu/Srinagar. Arrive Pahalgam. Register for yatra.'},
         {d:'Day 2',t:'Chandanwari',p:'Drive to Chandanwari base camp. Overnight tent stay.'},
         {d:'Day 3',t:'Holy Cave Darshan',p:'Trek to Amarnath Cave (14,500 ft). Darshan of Shivlingam.'},
         {d:'Day 4',t:'Return',p:'Return to Srinagar/Jammu. Tour ends.'}]}
];

var CARS = [
  {id:'c1',name:'Toyota Innova',sub:'Premium 7-Seater MPV',seats:7,type:'MPV',ppd:3200,ppk:18,
   img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=700&q=80',
   feats:['AC','Music System','USB Charging','Airbags'],sp:{eng:'2.4L Diesel',kmpl:'14 kmpl',boot:'Large'},
   desc:'Classic family MPV perfect for Kashmir road trips. Spacious, powerful & reliable.'},
  {id:'c2',name:'Innova Crysta',sub:'Luxury 7-Seater MPV',seats:7,type:'Luxury MPV',ppd:4000,ppk:22,
   img:'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=700&q=80',
   feats:['AC','Leather Seats','GPS','Sunroof','Premium Audio'],sp:{eng:'2.8L Diesel',kmpl:'12 kmpl',boot:'XL'},
   desc:'Ultimate premium MPV for a luxury Kashmir experience. Leather interiors, exceptional ground clearance.'},
  {id:'c3',name:'Innova Hycross',sub:'Hybrid 7/8-Seater MPV',seats:8,type:'Hybrid MPV',ppd:4500,ppk:24,
   img:'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=700&q=80',
   feats:['AC','Hybrid','Panoramic Roof','360° Camera','ADAS'],sp:{eng:'2.0L Hybrid',kmpl:'21 kmpl',boot:'XL'},
   desc:'Latest Innova Hycross — eco-friendly hybrid powertrain, panoramic sunroof, advanced safety features.'},
  {id:'c4',name:'Toyota Etios',sub:'Comfortable 4-Seater Sedan',seats:4,type:'Sedan',ppd:2200,ppk:14,
   img:'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=700&q=80',
   feats:['AC','Music System','USB Port'],sp:{eng:'1.5L Petrol',kmpl:'18 kmpl',boot:'Medium'},
   desc:'Fuel-efficient and comfortable for couples or small families. Great for Srinagar sightseeing.'},
  {id:'c5',name:'Honda Amaze',sub:'Stylish 4-Seater Sedan',seats:4,type:'Sedan',ppd:2400,ppk:15,
   img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=700&q=80',
   feats:['AC','Touchscreen','Reverse Camera','Airbags'],sp:{eng:'1.5L Diesel',kmpl:'20 kmpl',boot:'Medium'},
   desc:'Stylish, feature-packed sedan with excellent fuel efficiency.'},
  {id:'c6',name:'Maruti Eeco',sub:'Spacious 6-Seater Van',seats:6,type:'Van/MPV',ppd:2800,ppk:16,
   img:'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=700&q=80',
   feats:['AC','Wide Body','Easy Entry','Luggage Space'],sp:{eng:'1.2L Petrol',kmpl:'16 kmpl',boot:'Large'},
   desc:'Ideal for mid-size groups. Wide cabin, easy access, generous luggage space.'},
  {id:'c7',name:'Force Urbania',sub:'Premium 15-Seater Coach',seats:15,type:'Coach/Bus',ppd:7500,ppk:35,
   img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=700&q=80',
   feats:['AC','Pushback Seats','Individual Charging','Curtains','Captain Seats'],sp:{eng:'2.8L Diesel',kmpl:'10 kmpl',boot:'Under-bus Storage'},
   desc:'Premium 15-seater Force Urbania — perfect for large groups, ladies groups, and corporate tours. Luxurious pushback seats with AC.'}
];

var DESTINATIONS = {
  explored:[
    {name:'Srinagar',icon:'fas fa-water',note:'Dal Lake · Mughal Gardens · Houseboats'},
    {name:'Gulmarg',icon:'fas fa-snowflake',note:'Gondola · Skiing · Snow Activities'},
    {name:'Pahalgam',icon:'fas fa-mountain',note:'Betaab Valley · Aru Valley · Lidder River'},
    {name:'Sonamarg',icon:'fas fa-sun',note:'Thajiwas Glacier · Sindh River · Meadows'}
  ],
  hidden:[
    {name:'Kokernag',icon:'fas fa-leaf',note:'Natural Springs · Rose Garden · Trout Farm'},
    {name:'Aharbal',icon:'fas fa-water',note:'Kashmir\'s Niagara · Waterfall · Forests'},
    {name:'Daksum & Sinthan Top',icon:'fas fa-road',note:'Mountain Pass · Scenic Drive'},
    {name:'Martand Sun Temple',icon:'fas fa-landmark',note:'Ancient Hindu Temple · History'},
    {name:'Chhatabal',icon:'fas fa-seedling',note:'Trout Farming · Local Village · Quiet Retreat'}
  ],
  gems:[
    {name:'Warwan Valley',icon:'fas fa-gem',note:'Most Remote · Nomadic Life · Untouched'},
    {name:'Bangus Valley',icon:'fas fa-seedling',note:'Hidden Grasslands · Shepherds · Camping'},
    {name:'Gurez Valley',icon:'fas fa-mountain',note:'LOC Border · Razdan Pass · Dardic Culture'},
    {name:'Lolab Valley',icon:'fas fa-tree',note:'Valley of Streams · Apple Orchards · Serene'}
  ]
};

var TOUR_TYPES = [
  {id:'honeymoon',label:'💑 Honeymoon',ladiesClass:''},
  {id:'family',label:'👨‍👩‍👧 Family Trip',ladiesClass:''},
  {id:'group',label:'👥 Group Tour',ladiesClass:''},
  {id:'ladies',label:'🌸 Ladies Escape',ladiesClass:'ladies'},
  {id:'solo',label:'🎒 Solo Travel',ladiesClass:''},
  {id:'pilgrimage',label:'🕌 Pilgrimage',ladiesClass:''}
];

var TESTIS = [
  {n:'Priya Sharma',loc:'Mumbai',t:'KashmirHosts made our honeymoon magical! Gazanfar and his team arranged everything perfectly.',init:'PS'},
  {n:'Rahul Verma',loc:'Delhi',t:'Booked the Gulmarg Snow Experience — beyond expectations. Innova Crysta spotless, driver very knowledgeable.',init:'RV'},
  {n:'Ananya Reddy',loc:'Hyderabad',t:'As someone from Hyderabad, KashmirHosts felt like home. The Shaikpet office made coordination super easy!',init:'AR'},
  {n:'Vikram Singh',loc:'Chandigarh',t:'Third time booking with KashmirHosts — they never disappoint! Best prices and most comfortable vehicles.',init:'VS'},
  {n:'Meena Kapoor',loc:'Pune',t:'Solo trip to Kashmir was a dream. Team ensured my safety throughout. Sonamarg was breathtaking!',init:'MK'},
  {n:'Sahana Gowda',loc:'Bangalore',t:'Ladies Escape tour was AMAZING! Felt completely safe the whole time. Female guide was knowledgeable and caring.',init:'SG'}
];

/* ─── CARD BUILDERS ──────────────────────────────────────── */
function buildTourCard(t, i){
  var isLadies = (t.cat === 'ladies');
  var cardClass = isLadies ? 'card ladies-card' : 'card';
  var badgeClass = isLadies ? 'bdg bdg-pk' : 'bdg bdg-y';
  var btnClass = isLadies ? 'btn btn-pk btn-sm' : 'btn btn-y btn-sm';
  var priceColor = isLadies ? 'var(--pk)' : 'var(--c)';
  var itinBorder = isLadies ? 'pk' : '';
  var strip = isLadies ? '<div class="ladies-strip"></div>' : '';
  var delay = 'd'+(Math.min(i%3+1,5));
  var incHtml = t.inc.map(function(x){
    return '<span class="tc-in"><i class="fas fa-check-circle"></i>'+x+'</span>';
  }).join('');
  var itinHtml = t.itin.map(function(x){
    return '<div class="itin-day '+(isLadies?'pk':'')+'"><h5>'+x.d+': '+x.t+'</h5><p>'+x.p+'</p></div>';
  }).join('');
  return '<div class="'+cardClass+' fu '+delay+'">' +
    strip +
    '<div class="tc-wrap"><img class="card-img tc-img" src="'+t.img+'" alt="'+t.name+'" loading="lazy"/>'+
    '<div class="tc-badges"><span class="'+badgeClass+'">'+t.label+'</span>'+
    '<span class="bdg bdg-g">'+t.nights+'N/'+t.days+'D</span></div></div>'+
    '<div class="card-body" style="padding-bottom:0">'+
    '<h3 class="card-ti">'+t.name+'</h3>'+
    '<p class="card-de">'+t.desc+'</p>'+
    '<div class="tc-inc" style="margin-top:9px">'+incHtml+'</div>'+
    '<div style="display:flex;align-items:center;gap:5px;margin:9px 0">'+
    '<span class="stars">★★★★★</span><b style="font-size:.77rem">'+t.rating+'</b>'+
    '<span style="font-size:.71rem;color:var(--g3)">('+t.rev+')</span></div></div>'+
    '<button class="exp-btn" id="eb-'+t.id+'" onclick="toggleItinerary(\''+t.id+'\')">'+
    '<i class="fas fa-chevron-down"></i> View Itinerary</button>'+
    '<div class="exp-body" id="ex-'+t.id+'">'+itinHtml+'</div>'+
    '<div class="tc-foot">'+
    '<div><span class="price-old">'+fmt(t.old)+'</span><br>'+
    '<span class="price" style="color:'+priceColor+'">'+fmt(t.price)+'</span>'+
    '<span class="price-sub">/person</span></div>'+
    '<button class="'+btnClass+'" onclick="addToCart(\''+t.id+'\',\''+t.name+'\','+t.price+',\'tour\')">'+
    '<i class="fas fa-cart-plus"></i> Book</button></div></div>';
}

function buildCarCard(c, i, compact){
  var delay = 'd'+(Math.min(i%3+1,5));
  var specsHtml = !compact ?
    '<div class="car-specs">'+
    '<div class="cs"><i class="fas fa-users"></i>'+c.seats+' Passengers</div>'+
    '<div class="cs"><i class="fas fa-gas-pump"></i>'+c.sp.kmpl+'</div>'+
    '<div class="cs"><i class="fas fa-cog"></i>'+c.sp.eng+'</div>'+
    '<div class="cs"><i class="fas fa-suitcase"></i>'+c.sp.boot+'</div>'+
    '</div>' : '';
  var featsHtml = c.feats.map(function(f){
    return '<span class="cf"><i class="fas fa-check" style="font-size:.58rem;margin-right:2px"></i>'+f+'</span>';
  }).join('');
  return '<div class="card fu '+delay+'">' +
    '<div class="img-wrap"><img class="card-img" src="'+c.img+'" alt="'+c.name+'" loading="lazy"/></div>'+
    '<div class="card-body">'+
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'+
    '<div><h3 class="card-ti" style="margin:0">'+c.name+'</h3>'+
    '<p style="font-size:.77rem;color:var(--g3)">'+c.sub+'</p></div>'+
    '<span class="bdg bdg-g"><i class="fas fa-users"></i> '+c.seats+'</span></div>'+
    specsHtml+
    '<div class="car-feats">'+featsHtml+'</div>'+
    '<div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--g2);padding-top:11px">'+
    '<div><span class="price">'+fmt(c.ppd)+'</span><span class="price-sub">/day</span></div>'+
    '<div style="display:flex;gap:6px">'+
    '<a href="contact.html" class="btn btn-oy btn-sm">Inquire</a>'+
    '<button class="btn btn-y btn-sm" onclick="addToCart(\''+c.id+'\',\''+c.name+'\','+c.ppd+',\'vehicle\')">'+
    '<i class="fas fa-calendar-check"></i> Book</button></div></div></div></div>';
}

/* ─── HOME PAGE ──────────────────────────────────────────── */
function initHome(){
  if(!document.getElementById('hero')) return;

  // Hero Slideshow
  var slides = qsa('.hs');
  var dotsEl = document.getElementById('h-dots');
  var cur = 0;
  if(dotsEl && slides.length){
    dotsEl.innerHTML = slides.map(function(_,i){
      return '<button class="hdot'+(i===0?' on':'')+'" onclick="setSlide('+i+')"></button>';
    }).join('');
  }
  window.setSlide = function(n){
    slides[cur].classList.remove('on');
    var dots = qsa('.hdot');
    if(dots[cur]) dots[cur].classList.remove('on');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('on');
    if(dots[cur]) dots[cur].classList.add('on');
  };
  if(slides.length > 1){ setInterval(function(){ window.setSlide(cur+1); }, 5000); }

  // Search tabs
  qsa('.stab').forEach(function(tab){
    tab.addEventListener('click', function(){
      qsa('.stab').forEach(function(t){ t.classList.remove('on'); });
      tab.classList.add('on');
      var t = tab.dataset.tab;
      var st = document.getElementById('sf-tour');
      var sv = document.getElementById('sf-car');
      if(st) st.style.display = t==='tour' ? 'grid' : 'none';
      if(sv) sv.style.display = t==='vehicle' ? 'grid' : 'none';
    });
  });

  // Featured tours
  var ft = document.getElementById('feat-tours');
  if(ft){
    ft.innerHTML = TOURS.slice(0,3).map(function(t,i){ return buildTourCard(t,i); }).join('');
    runAnims();
  }

  // Featured vehicles
  var fv = document.getElementById('feat-vehicles');
  if(fv){
    fv.innerHTML = CARS.slice(0,3).map(function(c,i){ return buildCarCard(c,i,true); }).join('');
    runAnims();
  }

  initTestimonials();
}

/* ─── PLAN TRIP ──────────────────────────────────────────── */
function initPlanTrip(){
  var section = document.getElementById('plan-section');
  if(!section) return;

  var selType = null;
  var selDests = [];
  var activeTab = 'explored';

  // Tour type pills
  var pillsEl = document.getElementById('type-pills');
  if(pillsEl){
    pillsEl.innerHTML = TOUR_TYPES.map(function(t){
      return '<button class="tpill '+t.ladiesClass+'" data-type="'+t.id+'" onclick="selectTourType(\''+t.id+'\')">'+t.label+'</button>';
    }).join('');
  }

  // Destination tabs
  var dtabsEl = document.getElementById('dest-tabs');
  if(dtabsEl){
    dtabsEl.innerHTML =
      '<button class="dtab-btn on" data-dtab="explored" onclick="switchDestTab(\'explored\')">🔥 Most Explored</button>'+
      '<button class="dtab-btn" data-dtab="hidden" onclick="switchDestTab(\'hidden\')">🌿 Less Explored</button>'+
      '<button class="dtab-btn" data-dtab="gems" onclick="switchDestTab(\'gems\')">💎 Hidden Gems</button>';
  }
  renderDestList('explored');

  window._selType = null;
  window._selDests = [];

  window.selectTourType = function(id){
    window._selType = window._selType===id ? null : id;
    qsa('.tpill').forEach(function(p){ p.classList.toggle('on', p.dataset.type===window._selType); });
    updatePlanSummary();
  };
  window.switchDestTab = function(tab){
    qsa('.dtab-btn').forEach(function(b){ b.classList.toggle('on', b.dataset.dtab===tab); });
    renderDestList(tab);
  };
  window.toggleDest = function(name){
    var idx = window._selDests.indexOf(name);
    if(idx > -1) window._selDests.splice(idx,1); else window._selDests.push(name);
    qsa('.dest-item').forEach(function(d){ d.classList.toggle('on', window._selDests.indexOf(d.dataset.dest) > -1); });
    updatePlanSummary();
  };
  window.planNow = function(){
    var auth = getFirebaseAuth();
    if(auth && !auth.currentUser){
      localStorage.setItem('kh_redirect','book.html');
      toast('Please login to plan your trip','warn');
      setTimeout(function(){ location.href='login.html'; }, 1200);
      return;
    }
    location.href = 'book.html';
  };
}

function renderDestList(tab){
  var el = document.getElementById('dest-list');
  if(!el) return;
  var list = DESTINATIONS[tab] || [];
  el.innerHTML = list.map(function(d){
    return '<div class="dest-item" data-dest="'+d.name+'" onclick="toggleDest(\''+d.name+'\')">'+
      '<i class="'+d.icon+'"></i>'+
      '<div><span class="dest-nm">'+d.name+'</span>'+
      '<span class="dest-nt">'+d.note+'</span></div></div>';
  }).join('');
}

function updatePlanSummary(){
  var sum = document.getElementById('plan-summary');
  if(!sum) return;
  if(!window._selType && !window._selDests.length){ sum.classList.remove('show'); return; }
  sum.classList.add('show');
  var tags = document.getElementById('plan-tags');
  if(!tags) return;
  var items = [];
  if(window._selType){ var tp = TOUR_TYPES.find(function(t){ return t.id===window._selType; }); if(tp) items.push(tp.label); }
  window._selDests.forEach(function(d){ items.push('📍 '+d); });
  var dateVal = document.getElementById('plan-date') && document.getElementById('plan-date').value;
  if(dateVal) items.push('📅 '+fmtD(dateVal));
  var trvl = document.getElementById('plan-travellers') && document.getElementById('plan-travellers').value;
  if(trvl) items.push('👥 '+trvl);
  tags.innerHTML = items.map(function(it){ return '<span class="ptag">'+it+'</span>'; }).join('');
}

/* ─── TESTIMONIALS ───────────────────────────────────────── */
var tIdx = 0;
function initTestimonials(){
  var track = document.getElementById('testi-track');
  var dotsEl = document.getElementById('testi-dots');
  if(!track) return;
  track.innerHTML = TESTIS.map(function(t){
    return '<div class="tcard">'+
      '<div class="tcard-top"><div class="tav">'+t.init+'</div>'+
      '<div><div class="tname">'+t.n+'</div><div class="tloc"><i class="fas fa-map-marker-alt" style="color:var(--y);font-size:.65rem"></i> '+t.loc+'</div></div>'+
      '<div style="margin-left:auto"><span class="stars">★★★★★</span></div></div>'+
      '<p class="ttext">'+t.t+'</p></div>';
  }).join('');
  if(dotsEl){
    dotsEl.innerHTML = TESTIS.map(function(_,i){
      return '<button class="sldot'+(i===0?' on':'')+'" onclick="goTesti('+i+')"></button>';
    }).join('');
  }
  var prev = document.getElementById('t-prev');
  var next = document.getElementById('t-next');
  if(prev) prev.addEventListener('click', function(){ window.goTesti(tIdx-1); });
  if(next) next.addEventListener('click', function(){ window.goTesti(tIdx+1); });
  setInterval(function(){ window.goTesti(tIdx+1); }, 5000);
}
window.goTesti = function(n){
  var track = document.getElementById('testi-track');
  var dots = qsa('.sldot');
  var cards = qsa('.tcard');
  var vis = window.innerWidth > 1024 ? 3 : window.innerWidth > 640 ? 2 : 1;
  tIdx = Math.max(0, Math.min(n, TESTIS.length - vis));
  var w = cards[0] ? cards[0].offsetWidth + 20 : 0;
  if(track) track.style.transform = 'translateX(-'+(tIdx * w)+'px)';
  dots.forEach(function(d,i){ d.classList.toggle('on', i===tIdx); });
};

/* ─── TOURS PAGE ─────────────────────────────────────────── */
function initTours(){
  var grid = document.getElementById('tours-grid');
  if(!grid) return;
  var cat = 'all', sort = 'default';

  function render(){
    var data = cat==='all' ? TOURS.slice() : TOURS.filter(function(t){ return t.cat===cat; });
    if(sort==='price-asc') data.sort(function(a,b){ return a.price-b.price; });
    else if(sort==='price-desc') data.sort(function(a,b){ return b.price-a.price; });
    else if(sort==='days-asc') data.sort(function(a,b){ return a.days-b.days; });
    grid.innerHTML = data.map(function(t,i){ return buildTourCard(t,i); }).join('');
    var c = document.getElementById('tours-count');
    if(c) c.textContent = 'Showing '+data.length+' package'+(data.length!==1?'s':'');
    runAnims();
  }
  render();

  qsa('.fbtn').forEach(function(b){
    b.addEventListener('click', function(){
      qsa('.fbtn').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      cat = b.dataset.cat;
      render();
    });
  });
  var sortEl = document.getElementById('sort-sel');
  if(sortEl) sortEl.addEventListener('change', function(){ sort=sortEl.value; render(); });

  // Accordion
  qsa('.acc-hd').forEach(function(h){
    h.addEventListener('click', function(){
      var bd = h.nextElementSibling;
      var isOpen = bd.classList.contains('open');
      qsa('.acc-hd').forEach(function(x){ x.classList.remove('open'); });
      qsa('.acc-bd').forEach(function(x){ x.classList.remove('open'); });
      if(!isOpen){ h.classList.add('open'); bd.classList.add('open'); }
    });
  });
}
window.toggleItinerary = function(id){
  var body = document.getElementById('ex-'+id);
  var btn = document.getElementById('eb-'+id);
  if(!body || !btn) return;
  body.classList.toggle('open');
  btn.classList.toggle('open');
  btn.innerHTML = body.classList.contains('open')
    ? '<i class="fas fa-chevron-up"></i> Hide Itinerary'
    : '<i class="fas fa-chevron-down"></i> View Itinerary';
};

/* ─── CARS PAGE ──────────────────────────────────────────── */
function initCars(){
  var g = document.getElementById('cars-grid');
  if(!g) return;
  g.innerHTML = CARS.map(function(c,i){ return buildCarCard(c,i); }).join('');
  runAnims();
}

/* ─── BOOK / CART ────────────────────────────────────────── */
function initBook(){
  var cartItems = document.getElementById('cart-items');
  if(!cartItems) return;
  renderCart();
  var di = document.getElementById('b-date');
  if(di) di.min = new Date().toISOString().split('T')[0];
  var auth = getFirebaseAuth();
  if(auth){
    auth.onAuthStateChanged(function(user){
      if(user){
        var ni = document.getElementById('b-name');
        if(ni && !ni.value) ni.value = user.displayName||'';
      }
    });
  }
}
function renderCart(){
  var items = Cart.get();
  var cEl = document.getElementById('cart-items');
  var sEl = document.getElementById('sum-items');
  var bfSec = document.getElementById('bform-sec');
  if(!cEl) return;
  if(!items.length){
    cEl.innerHTML = '<div class="empty-cart"><div class="eic">🛒</div><h3>Your cart is empty</h3>'+
      '<p style="color:var(--g3);margin-bottom:18px">Browse our tours and vehicles</p>'+
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">'+
      '<a href="tours.html" class="btn btn-y"><i class="fas fa-map-marked-alt"></i> Browse Tours</a>'+
      '<a href="cars.html" class="btn btn-oy"><i class="fas fa-car"></i> View Vehicles</a></div></div>';
    if(bfSec) bfSec.style.display = 'none';
    updateSumTotals(0);
    return;
  }
  cEl.innerHTML = items.map(function(it){
    return '<div class="ci-row">'+
      '<div class="ci-icon">'+(it.type==='tour'?'🏔️':'🚗')+'</div>'+
      '<div style="flex:1"><div class="ci-name">'+it.name+'</div>'+
      '<span class="bdg '+(it.type==='tour'?'bdg-y':'bdg-g')+'">'+(it.type==='tour'?'Tour Package':'Vehicle Rental')+'</span></div>'+
      '<div style="font-family:var(--ffh);font-size:1.05rem;font-weight:700">'+fmt(it.price)+'</div>'+
      '<button class="ci-rm" onclick="removeItem(\''+it.id+'\')"><i class="fas fa-times"></i></button></div>';
  }).join('');
  if(sEl) sEl.innerHTML = items.map(function(it){
    return '<div class="or-item"><span>'+it.name+'</span><b>'+fmt(it.price)+'</b></div>';
  }).join('');
  if(bfSec) bfSec.style.display = 'block';
  updateSumTotals(Cart.total());
}
function updateSumTotals(sub){
  var tax = Math.round(sub*.05);
  var auth = getFirebaseAuth();
  var disc = (auth && auth.currentUser) ? Math.round(sub*.02) : 0;
  var tot = sub+tax-disc;
  function s(id,v){ var e=document.getElementById(id); if(e) e.textContent=fmt(v); }
  s('sum-sub',sub); s('sum-tax',tax); s('sum-disc',disc); s('sum-tot',tot);
}
window.removeItem = function(id){ Cart.remove(id); renderCart(); toast('Item removed','info'); };

window.handleCheckout = function(){
  var auth = getFirebaseAuth();
  var db = getFirestore();
  if(!auth || !auth.currentUser){ toast('Please login to checkout','warn'); setTimeout(function(){ location.href='login.html'; },1300); return; }
  var items = Cart.get();
  if(!items.length){ toast('Your cart is empty!','warn'); return; }
  var name = document.getElementById('b-name') && document.getElementById('b-name').value;
  var phone = document.getElementById('b-phone') && document.getElementById('b-phone').value;
  var date = document.getElementById('b-date') && document.getElementById('b-date').value;
  if(!name||!phone||!date){ toast('Please fill all required travel details','warn'); var bf=document.getElementById('bform-sec'); if(bf) bf.scrollIntoView({behavior:'smooth'}); return; }
  var btn = document.getElementById('checkout-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Processing...'; }
  var sub = Cart.total(), tax = Math.round(sub*.05), disc = Math.round(sub*.02), total = sub+tax-disc;
  var booking = {
    userId: auth.currentUser.uid, userName: name, phone: phone, date: date,
    guests: document.getElementById('b-guests') && document.getElementById('b-guests').value,
    pickup: document.getElementById('b-pickup') && document.getElementById('b-pickup').value,
    notes: document.getElementById('b-notes') && document.getElementById('b-notes').value,
    items: items, subtotal: sub, tax: tax, discount: disc, total: total,
    status: 'confirmed', createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if(db){
    db.collection('bookings').add(booking).then(function(ref){
      Cart.clear(); renderCart();
      var ri = document.getElementById('booking-ref');
      if(ri) ri.textContent = ref.id.slice(0,14).toUpperCase();
      var sm = document.getElementById('suc-modal');
      if(sm) sm.classList.add('show');
      toast('Booking confirmed! 🎉','ok');
    }).catch(function(err){
      console.error(err); toast('Booking failed. Please try again.','err');
    }).finally(function(){
      if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-credit-card"></i> Proceed to Checkout'; }
    });
  } else {
    // Fallback without Firebase
    var ri = document.getElementById('booking-ref');
    if(ri) ri.textContent = 'KH'+Date.now().toString().slice(-10).toUpperCase();
    var sm = document.getElementById('suc-modal');
    if(sm) sm.classList.add('show');
    Cart.clear(); renderCart();
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-credit-card"></i> Proceed to Checkout'; }
  }
};

/* ─── AUTH PAGES ─────────────────────────────────────────── */
window.handleLogin = function(e){
  e.preventDefault();
  var email = document.getElementById('l-email') && document.getElementById('l-email').value;
  var pass = document.getElementById('l-pass') && document.getElementById('l-pass').value;
  var errEl = document.getElementById('l-err');
  var btn = document.getElementById('l-btn');
  var auth = getFirebaseAuth();
  if(errEl) errEl.style.display='none';
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Signing in...'; }
  if(!auth){
    toast('Firebase not configured. Please setup firebase.js','err');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-sign-in-alt"></i> Sign In'; }
    return;
  }
  auth.signInWithEmailAndPassword(email, pass).then(function(){
    toast('Welcome back! 🏔️','ok');
    var redir = localStorage.getItem('kh_redirect')||'dashboard.html';
    localStorage.removeItem('kh_redirect');
    setTimeout(function(){ location.href=redir; }, 800);
  }).catch(function(err){
    var msg = err.code==='auth/invalid-credential'||err.code==='auth/wrong-password'||err.code==='auth/user-not-found'
      ? 'Invalid email or password. Please check and try again.' : err.message;
    if(errEl){ errEl.innerHTML='<i class="fas fa-exclamation-circle"></i> '+msg; errEl.style.display='flex'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-sign-in-alt"></i> Sign In'; }
  });
};

window.handleSignup = function(e){
  e.preventDefault();
  var fname = document.getElementById('s-fname') && document.getElementById('s-fname').value;
  var lname = document.getElementById('s-lname') && document.getElementById('s-lname').value;
  var email = document.getElementById('s-email') && document.getElementById('s-email').value;
  var pass = document.getElementById('s-pass') && document.getElementById('s-pass').value;
  var phone = document.getElementById('s-phone') && document.getElementById('s-phone').value;
  var errEl = document.getElementById('s-err');
  var btn = document.getElementById('s-btn');
  var auth = getFirebaseAuth();
  var db = getFirestore();
  if(errEl) errEl.style.display='none';
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Creating account...'; }
  if(!auth){
    toast('Firebase not configured.','err');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-user-plus"></i> Create Account'; }
    return;
  }
  auth.createUserWithEmailAndPassword(email, pass).then(function(cred){
    return cred.user.updateProfile({displayName: fname+' '+lname}).then(function(){
      if(db){
        return db.collection('users').doc(cred.user.uid).set({
          name: fname+' '+lname, email: email, phone: phone||'',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }).then(function(){
      toast('Welcome to KashmirHosts, '+fname+'! 🎉','ok');
      setTimeout(function(){ location.href='dashboard.html'; }, 800);
    });
  }).catch(function(err){
    var msg = err.code==='auth/email-already-in-use'
      ? 'This email is already registered. Please sign in instead.' : err.message;
    if(errEl){ errEl.innerHTML='<i class="fas fa-exclamation-circle"></i> '+msg; errEl.style.display='flex'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-user-plus"></i> Create Account'; }
  });
};

window.handleGoogle = function(){
  var auth = getFirebaseAuth();
  var db = getFirestore();
  if(!auth){ toast('Firebase not configured.','err'); return; }
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(function(result){
    var user = result.user;
    if(db){
      db.collection('users').doc(user.uid).get().then(function(snap){
        if(!snap.exists){
          db.collection('users').doc(user.uid).set({
            name: user.displayName, email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    }
    toast('Signed in with Google! 🎉','ok');
    var redir = localStorage.getItem('kh_redirect')||'dashboard.html';
    localStorage.removeItem('kh_redirect');
    setTimeout(function(){ location.href=redir; }, 800);
  }).catch(function(err){ toast(err.message,'err'); });
};

window.togglePw = function(id, btn){
  var inp = document.getElementById(id);
  if(!inp) return;
  inp.type = inp.type==='password' ? 'text' : 'password';
  var icon = btn.querySelector('i');
  if(icon) icon.className = inp.type==='password' ? 'fas fa-eye' : 'fas fa-eye-slash';
};
window.checkPwStrength = function(val){
  var wr=document.getElementById('pw-strength'), fill=document.getElementById('pw-fill'), lbl=document.getElementById('pw-lbl');
  if(!wr) return;
  wr.style.display = val.length ? 'flex' : 'none';
  var s=0;
  if(val.length>=8)s++; if(/[A-Z]/.test(val))s++; if(/[0-9]/.test(val))s++; if(/[^A-Za-z0-9]/.test(val))s++;
  var lvls=[{w:'20%',c:'#ef4444',t:'Weak'},{w:'45%',c:'#f97316',t:'Fair'},{w:'72%',c:'#eab308',t:'Good'},{w:'100%',c:'#22c55e',t:'Strong'}];
  var l = lvls[Math.min(s-1,3)] || lvls[0];
  if(fill){ fill.style.width=l.w; fill.style.background=l.c; }
  if(lbl) lbl.textContent = 'Strength: '+l.t;
};

/* ─── DASHBOARD ──────────────────────────────────────────── */
function initDashboard(){
  var tabOverview = document.getElementById('tab-overview');
  if(!tabOverview) return;

  var auth = getFirebaseAuth();
  if(!auth){ location.href='login.html'; return; }

  auth.onAuthStateChanged(function(user){
    if(!user){ localStorage.setItem('kh_redirect','dashboard.html'); location.href='login.html'; return; }
    var name = user.displayName || user.email.split('@')[0];
    var dsbn = document.getElementById('dsb-name');
    var dsbav = document.getElementById('dsb-av');
    var dwn = document.getElementById('dw-name');
    if(dsbn) dsbn.textContent = name;
    if(dsbav) dsbav.textContent = name.charAt(0).toUpperCase();
    if(dwn) dwn.textContent = name.split(' ')[0]||'Traveler';
    var prn = document.getElementById('pr-name');
    var pre = document.getElementById('pr-email');
    if(prn) prn.value = user.displayName||'';
    if(pre) pre.value = user.email||'';
    var db = getFirestore();
    if(db){
      db.collection('users').doc(user.uid).get().then(function(snap){
        if(snap.exists){
          var d = snap.data();
          var prph = document.getElementById('pr-phone');
          var prci = document.getElementById('pr-city');
          if(prph) prph.value = d.phone||'';
          if(prci) prci.value = d.city||'';
        }
      });
    }
    loadUserBookings(user.uid);
  });

  qsa('.dn[data-tab]').forEach(function(n){
    n.addEventListener('click', function(e){
      e.preventDefault();
      switchDTab(n.dataset.tab);
    });
  });
  runAnims();
}

function loadUserBookings(uid){
  var db = getFirestore();
  if(!db){ renderRecentBks([]); renderAllBks([]); updateDashStats([]); return; }
  db.collection('bookings').where('userId','==',uid).orderBy('createdAt','desc').get()
    .then(function(snap){
      var bks = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
      updateDashStats(bks);
      renderRecentBks(bks.slice(0,4));
      renderAllBks(bks);
    }).catch(function(){ updateDashStats([]); renderRecentBks([]); renderAllBks([]); });
}
function updateDashStats(bks){
  function s(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
  s('st-total', bks.length);
  s('st-conf', bks.filter(function(b){ return b.status==='confirmed'; }).length);
  s('st-spent', fmt(bks.reduce(function(acc,b){ return acc+(b.total||0); },0)));
  s('st-trips', bks.filter(function(b){ return b.date && new Date(b.date)<new Date(); }).length);
}
function renderRecentBks(bks){
  var el = document.getElementById('recent-bks');
  if(!el) return;
  if(!bks.length){
    el.innerHTML='<div style="padding:20px;text-align:center;color:var(--g3)">No bookings yet. <a href="tours.html" style="color:var(--yd);font-weight:600">Explore tours!</a></div>';
    return;
  }
  el.innerHTML = bks.map(function(b){
    var stcls = b.status==='confirmed'?'st-c':b.status==='cancelled'?'st-x':'st-p';
    var icon = b.items&&b.items[0]&&b.items[0].type==='vehicle'?'🚗':'🏔️';
    return '<div class="bk-row">'+
      '<div class="bk-ic">'+icon+'</div>'+
      '<div style="flex:1"><div class="bk-ti">'+(b.items&&b.items[0]?b.items[0].name:'Kashmir Package')+'</div>'+
      '<div class="bk-me">📅 '+fmtD(b.date)+' · ID: '+b.id.slice(0,10).toUpperCase()+'</div></div>'+
      '<span class="bk-st '+stcls+'">'+b.status+'</span></div>';
  }).join('');
}
function renderAllBks(bks){
  var el = document.getElementById('all-bks');
  if(!el) return;
  if(!bks.length){
    el.innerHTML='<div style="text-align:center;padding:55px;background:var(--wh);border-radius:var(--rlg);border:1px solid var(--g2)">'+
      '<div style="font-size:3rem;margin-bottom:12px">🏔️</div>'+
      '<h3 style="font-family:var(--ffh);margin-bottom:8px;color:var(--c)">No bookings yet</h3>'+
      '<p style="color:var(--g3);margin-bottom:18px">Start your Kashmir journey today!</p>'+
      '<a href="tours.html" class="btn btn-y">Browse Tours</a></div>';
    return;
  }
  el.innerHTML = bks.map(function(b){
    var stcls = b.status==='confirmed'?'st-c':b.status==='cancelled'?'st-x':'st-p';
    var tagsHtml = (b.items||[]).map(function(item){
      return '<span class="bdg '+(item.type==='tour'?'bdg-y':'bdg-g')+'">'+(item.type==='tour'?'🏔️':'🚗')+' '+item.name+'</span>';
    }).join('');
    return '<div class="fbc">'+
      '<div class="fbc-top"><div>'+
      '<div class="fbc-id">Booking ID: '+b.id.slice(0,14).toUpperCase()+'</div>'+
      '<div class="fbc-n">'+(b.items?b.items.map(function(i){ return i.name; }).join(' + '):'Kashmir Package')+'</div></div>'+
      '<span class="bk-st '+stcls+'" style="font-size:.79rem;padding:4px 11px">'+
        (b.status?b.status.charAt(0).toUpperCase()+b.status.slice(1):'')+'</span></div>'+
      '<div class="fbc-tags">'+tagsHtml+'</div>'+
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:9px;font-size:.79rem;color:var(--g3)">'+
      '<span><i class="fas fa-user" style="color:var(--yd)"></i> '+(b.userName||'N/A')+'</span>'+
      '<span><i class="fas fa-calendar" style="color:var(--yd)"></i> '+fmtD(b.date)+'</span>'+
      '<span><i class="fas fa-users" style="color:var(--yd)"></i> '+(b.guests||'—')+'</span></div>'+
      '<div class="fbc-ft">'+
      '<span style="font-size:.75rem;color:var(--g3)">Booked '+fmtD(b.createdAt)+'</span>'+
      '<div style="display:flex;align-items:center;gap:11px">'+
      '<span class="price">'+fmt(b.total||0)+'</span>'+
      '<a href="https://wa.me/919876543210" class="btn btn-pk btn-sm" target="_blank"><i class="fab fa-whatsapp"></i> Support</a>'+
      '</div></div></div>';
  }).join('');
}
function switchDTab(name){
  qsa('.dtab').forEach(function(t){ t.classList.remove('on'); });
  qsa('.dn').forEach(function(n){ n.classList.remove('on'); });
  var tab = document.getElementById('tab-'+name);
  if(tab) tab.classList.add('on');
  qsa('.dn[data-tab="'+name+'"]').forEach(function(n){ n.classList.add('on'); });
  var titles={overview:'Dashboard',bookings:'My Bookings',profile:'My Profile'};
  var ti = document.getElementById('dtop-ti');
  if(ti) ti.textContent = titles[name]||'Dashboard';
  if(window.innerWidth<900){ var dsb=document.getElementById('dsb'); if(dsb) dsb.classList.remove('open'); }
}
window.switchDTab = switchDTab;
window.saveProfile = function(){
  var user = getFirebaseAuth() && getFirebaseAuth().currentUser;
  if(!user) return;
  var db = getFirestore();
  if(!db){ toast('Firebase not configured','err'); return; }
  var data = {
    name: document.getElementById('pr-name')&&document.getElementById('pr-name').value||'',
    phone: document.getElementById('pr-phone')&&document.getElementById('pr-phone').value||'',
    city: document.getElementById('pr-city')&&document.getElementById('pr-city').value||''
  };
  db.collection('users').doc(user.uid).update(data)
    .then(function(){ toast('Profile updated!','ok'); })
    .catch(function(){ toast('Update failed.','err'); });
};

/* ─── ADMIN ──────────────────────────────────────────────── */
var ADMIN_EMAIL = 'admin@kashmirhosts.com';
var aTours = TOURS.slice();
var aCars = CARS.slice();
var editTId = null, editCId = null;

window.adminLogin = function(){
  var email = document.getElementById('adm-email')&&document.getElementById('adm-email').value;
  var pass = document.getElementById('adm-pass')&&document.getElementById('adm-pass').value;
  var errEl = document.getElementById('adm-err');
  var btn = document.getElementById('adm-btn');
  var auth = getFirebaseAuth();
  if(errEl) errEl.style.display='none';
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Verifying...'; }
  if(!auth){
    if(errEl){ errEl.innerHTML='Firebase not configured. Please setup firebase.js'; errEl.style.display='flex'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-lock-open"></i> Access Admin'; }
    return;
  }
  auth.signInWithEmailAndPassword(email, pass).then(function(cred){
    if(cred.user.email !== ADMIN_EMAIL){ auth.signOut(); throw new Error('Not an admin account.'); }
    var lo = document.getElementById('adm-login');
    var pn = document.getElementById('adm-panel');
    if(lo) lo.style.display='none';
    if(pn) pn.style.display='grid';
    toast('Welcome, Admin Gazanfar! 🎉','ok');
    loadAdminData();
  }).catch(function(err){
    if(errEl){ errEl.innerHTML='<i class="fas fa-exclamation-circle"></i> '+err.message+'. Use admin@kashmirhosts.com'; errEl.style.display='flex'; }
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-lock-open"></i> Access Admin'; }
  });
};
window.adminLogout = function(){
  var auth = getFirebaseAuth();
  if(auth) auth.signOut();
  var lo=document.getElementById('adm-login'), pn=document.getElementById('adm-panel');
  if(pn) pn.style.display='none';
  if(lo) lo.style.display='flex';
  toast('Logged out','info');
};

function loadAdminData(){
  var db = getFirestore();
  if(!db){ toast('Firebase not configured','err'); return; }
  db.collection('bookings').get().then(function(snap){
    var bks = snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
    var rev = bks.reduce(function(s,b){ return s+(b.total||0); },0);
    var uids = [];
    bks.forEach(function(b){ if(uids.indexOf(b.userId)===-1) uids.push(b.userId); });
    function s(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
    s('a-bks',bks.length); s('a-rev',fmt(rev)); s('a-usr',uids.length); s('a-tours',aTours.length);
    renderAdminBksTable(bks);
    renderAdminRecentBks(bks.slice(0,5));
  });
  renderAdminTours(); renderAdminCars();
  var db2 = getFirestore();
  if(db2) db2.collection('users').get().then(function(snap){
    renderUsersTable(snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); }));
  });
  runAnims();
}
function renderAdminBksTable(bks){
  var tb = document.getElementById('bks-tbody'); if(!tb) return;
  if(!bks.length){ tb.innerHTML='<tr><td colspan="7" style="text-align:center;padding:26px;color:var(--g3)">No bookings yet</td></tr>'; return; }
  tb.innerHTML = bks.map(function(b){
    var stcls=b.status==='confirmed'?'st-c':b.status==='cancelled'?'st-x':'st-p';
    return '<tr><td><b>'+b.id.slice(0,12).toUpperCase()+'</b></td>'+
      '<td>'+(b.userName||'N/A')+'<br><small style="color:var(--g3)">'+(b.phone||'')+'</small></td>'+
      '<td>'+(b.items?b.items.map(function(i){ return i.name; }).join(', '):'N/A')+'</td>'+
      '<td>'+fmtD(b.date)+'</td>'+
      '<td><b>'+fmt(b.total||0)+'</b></td>'+
      '<td><span class="bk-st '+stcls+'">'+b.status+'</span></td>'+
      '<td>'+
      '<button class="btn btn-sm" style="background:var(--yl);color:var(--yd);padding:5px 10px" onclick="cycleStatus(\''+b.id+'\',\''+b.status+'\')"><i class="fas fa-sync"></i></button> '+
      '<button class="btn btn-red btn-sm" style="padding:5px 10px" onclick="deleteBk(\''+b.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</td></tr>';
  }).join('');
}
function renderAdminRecentBks(bks){
  var el = document.getElementById('adm-recent'); if(!el) return;
  el.innerHTML = bks.length ? bks.map(function(b){
    var stcls=b.status==='confirmed'?'st-c':'st-p';
    return '<div class="bk-row"><div class="bk-ic">📋</div>'+
      '<div style="flex:1"><div class="bk-ti">'+(b.userName||'—')+' — '+(b.items&&b.items[0]?b.items[0].name:'Package')+'</div>'+
      '<div class="bk-me">'+b.id.slice(0,10).toUpperCase()+' · '+fmt(b.total||0)+'</div></div>'+
      '<span class="bk-st '+stcls+'">'+b.status+'</span></div>';
  }).join('') : '<div style="padding:20px;text-align:center;color:var(--g3)">No bookings yet.</div>';
}
function renderAdminTours(){
  var g=document.getElementById('adm-tours'); if(!g) return;
  g.innerHTML=aTours.map(function(t){
    return '<div class="adm-card fu vis">'+
      '<img class="adm-img" src="'+t.img+'" alt="'+t.name+'" loading="lazy"/>'+
      '<div class="adm-n">'+t.name+'</div>'+
      '<div class="adm-m"><span class="bdg '+(t.cat==='ladies'?'bdg-pk':'bdg-y')+'">'+t.label+'</span> '+
      '<span class="bdg bdg-g">'+t.days+'D</span>'+
      '<div style="margin-top:5px;font-weight:700;color:var(--c)">'+fmt(t.price)+'/person</div></div>'+
      '<div class="adm-acts">'+
      '<button class="btn btn-oy btn-sm" onclick="openTourMod(\''+t.id+'\')"><i class="fas fa-edit"></i> Edit</button>'+
      '<button class="btn btn-red btn-sm" onclick="deleteTour(\''+t.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</div></div>';
  }).join('');
}
function renderAdminCars(){
  var g=document.getElementById('adm-cars'); if(!g) return;
  g.innerHTML=aCars.map(function(c){
    return '<div class="adm-card fu vis">'+
      '<img class="adm-img" src="'+c.img+'" alt="'+c.name+'" loading="lazy"/>'+
      '<div class="adm-n">'+c.name+'</div>'+
      '<div class="adm-m"><span class="bdg bdg-g">'+c.type+'</span> '+
      '<span class="bdg bdg-y"><i class="fas fa-users"></i> '+c.seats+'</span>'+
      '<div style="margin-top:5px;font-weight:700;color:var(--c)">'+fmt(c.ppd)+'/day</div></div>'+
      '<div class="adm-acts">'+
      '<button class="btn btn-oy btn-sm" onclick="openCarMod(\''+c.id+'\')"><i class="fas fa-edit"></i> Edit</button>'+
      '<button class="btn btn-red btn-sm" onclick="deleteCar(\''+c.id+'\')"><i class="fas fa-trash"></i></button>'+
      '</div></div>';
  }).join('');
}
function renderUsersTable(users){
  var tb=document.getElementById('usr-tbody'); if(!tb) return;
  if(!users.length){ tb.innerHTML='<tr><td colspan="4" style="text-align:center;padding:26px;color:var(--g3)">No users yet</td></tr>'; return; }
  tb.innerHTML=users.map(function(u){
    return '<tr><td><b>'+(u.name||'N/A')+'</b></td><td>'+(u.email||u.id)+'</td><td>'+(u.phone||'N/A')+'</td><td>'+fmtD(u.createdAt)+'</td></tr>';
  }).join('');
}
window.openTourMod = function(id){
  editTId = id;
  var t = aTours.find(function(x){ return x.id===id; });
  function gi(s){ return document.getElementById(s); }
  var title = gi('tm-title'); if(title) title.textContent = id?'Edit Tour':'Add New Tour';
  if(t){
    if(gi('tm-name')) gi('tm-name').value=t.name;
    if(gi('tm-cat')) gi('tm-cat').value=t.cat;
    if(gi('tm-days')) gi('tm-days').value=t.days;
    if(gi('tm-price')) gi('tm-price').value=t.price;
    if(gi('tm-img')) gi('tm-img').value=t.img||'';
    if(gi('tm-desc')) gi('tm-desc').value=t.desc||'';
  } else {
    ['tm-name','tm-img','tm-desc'].forEach(function(s){ var e=gi(s); if(e)e.value=''; });
    if(gi('tm-days')) gi('tm-days').value=3;
    if(gi('tm-price')) gi('tm-price').value='';
  }
  var mod=document.getElementById('tour-mod'); if(mod) mod.classList.add('show');
};
window.openTourMod_ = function(){ editTId=null; window.openTourMod(null); };
window.saveTour = function(){
  function gi(s){ return document.getElementById(s); }
  var name=gi('tm-name')&&gi('tm-name').value.trim(), price=Number(gi('tm-price')&&gi('tm-price').value);
  if(!name||!price){ toast('Fill all required fields','warn'); return; }
  var data={name:name,cat:gi('tm-cat')&&gi('tm-cat').value,days:Number(gi('tm-days')&&gi('tm-days').value),price:price,
    img:gi('tm-img')&&gi('tm-img').value||'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=400',
    desc:gi('tm-desc')&&gi('tm-desc').value||''};
  var db=getFirestore();
  var p = editTId && db ? db.collection('tours').doc(editTId).set(data,{merge:true}) : (db ? db.collection('tours').add(data).then(function(ref){ data.id=ref.id; editTId=ref.id; }) : Promise.resolve());
  p.then(function(){
    var idx=aTours.findIndex(function(t){ return t.id===editTId; });
    data.id=editTId||data.id;
    if(idx>-1) aTours[idx]=Object.assign(aTours[idx],data); else aTours.push(data);
    renderAdminTours(); window.closeModal('tour-mod'); toast(editTId?'Tour updated!':'Tour added!','ok');
  }).catch(function(){ renderAdminTours(); window.closeModal('tour-mod'); toast('Saved locally','ok'); });
};
window.deleteTour = function(id){
  if(!confirm('Delete this tour?')) return;
  aTours = aTours.filter(function(t){ return t.id!==id; });
  var db=getFirestore(); if(db) db.collection('tours').doc(id).delete().catch(function(){});
  renderAdminTours(); toast('Tour deleted','info');
};
window.openCarMod = function(id){
  editCId = id;
  var c = aCars.find(function(x){ return x.id===id; });
  function gi(s){ return document.getElementById(s); }
  var title=gi('cm-title'); if(title) title.textContent=id?'Edit Vehicle':'Add Vehicle';
  if(c){
    if(gi('cm-name')) gi('cm-name').value=c.name;
    if(gi('cm-type')) gi('cm-type').value=c.type;
    if(gi('cm-seats')) gi('cm-seats').value=c.seats;
    if(gi('cm-price')) gi('cm-price').value=c.ppd;
    if(gi('cm-img')) gi('cm-img').value=c.img||'';
    if(gi('cm-desc')) gi('cm-desc').value=c.desc||'';
  } else {
    ['cm-name','cm-img','cm-desc'].forEach(function(s){ var e=gi(s); if(e)e.value=''; });
    if(gi('cm-seats')) gi('cm-seats').value=7;
    if(gi('cm-price')) gi('cm-price').value='';
  }
  var mod=document.getElementById('car-mod'); if(mod) mod.classList.add('show');
};
window.openCarMod_ = function(){ editCId=null; window.openCarMod(null); };
window.saveCar = function(){
  function gi(s){ return document.getElementById(s); }
  var name=gi('cm-name')&&gi('cm-name').value.trim(), price=Number(gi('cm-price')&&gi('cm-price').value);
  if(!name||!price){ toast('Fill all required fields','warn'); return; }
  var data={name:name,type:gi('cm-type')&&gi('cm-type').value,seats:Number(gi('cm-seats')&&gi('cm-seats').value),ppd:price,
    img:gi('cm-img')&&gi('cm-img').value||'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400',
    desc:gi('cm-desc')&&gi('cm-desc').value||''};
  var db=getFirestore();
  var p=editCId&&db ? db.collection('cars').doc(editCId).set(data,{merge:true}) : (db?db.collection('cars').add(data).then(function(ref){ data.id=ref.id; editCId=ref.id; }):Promise.resolve());
  p.then(function(){
    var idx=aCars.findIndex(function(c){ return c.id===editCId; });
    data.id=editCId||data.id;
    if(idx>-1) aCars[idx]=Object.assign(aCars[idx],data); else aCars.push(data);
    renderAdminCars(); window.closeModal('car-mod'); toast(editCId?'Vehicle updated!':'Vehicle added!','ok');
  }).catch(function(){ renderAdminCars(); window.closeModal('car-mod'); toast('Saved locally','ok'); });
};
window.deleteCar = function(id){
  if(!confirm('Delete this vehicle?')) return;
  aCars=aCars.filter(function(c){ return c.id!==id; });
  var db=getFirestore(); if(db) db.collection('cars').doc(id).delete().catch(function(){});
  renderAdminCars(); toast('Vehicle deleted','info');
};
window.cycleStatus = function(id,cur){
  var statuses=['confirmed','pending','cancelled'];
  var next=statuses[(statuses.indexOf(cur)+1)%statuses.length];
  var db=getFirestore();
  if(db) db.collection('bookings').doc(id).update({status:next})
    .then(function(){ toast('Status → '+next,'ok'); loadAdminData(); })
    .catch(function(){ toast('Update failed','err'); });
};
window.deleteBk = function(id){
  if(!confirm('Delete this booking?')) return;
  var db=getFirestore();
  if(db) db.collection('bookings').doc(id).delete()
    .then(function(){ toast('Deleted','info'); loadAdminData(); })
    .catch(function(){ toast('Delete failed','err'); });
};
window.exportCSV = function(){
  var db=getFirestore();
  if(!db){ toast('Firebase not configured','err'); return; }
  db.collection('bookings').get().then(function(snap){
    var bks=snap.docs.map(function(d){ return Object.assign({id:d.id},d.data()); });
    if(!bks.length){ toast('No bookings to export','warn'); return; }
    var head='ID,Customer,Phone,Date,Guests,Amount,Status\n';
    var rows=bks.map(function(b){ return b.id+','+(b.userName||'')+','+(b.phone||'')+','+(b.date||'')+','+(b.guests||'')+','+(b.total||0)+','+b.status; }).join('\n');
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([head+rows],{type:'text/csv'}));
    a.download='kashmirhosts-bookings.csv'; a.click();
    toast('Exported!','ok');
  });
};
function switchATab(name){
  qsa('.dtab').forEach(function(t){ t.classList.remove('on'); });
  qsa('.dn').forEach(function(n){ n.classList.remove('on'); });
  var tab=document.getElementById('tab-'+name); if(tab) tab.classList.add('on');
  qsa('.dn[data-tab="'+name+'"]').forEach(function(n){ n.classList.add('on'); });
  var titles={overview:'Admin Overview',bookings:'All Bookings',tours:'Manage Tours',vehicles:'Manage Vehicles',users:'Users'};
  var ti=document.getElementById('adm-top-ti'); if(ti) ti.textContent=titles[name]||'Admin';
  if(window.innerWidth<900){ var dsb=document.getElementById('dsb'); if(dsb) dsb.classList.remove('open'); }
}
window.switchATab = switchATab;

/* ─── CONTACT ────────────────────────────────────────────── */
window.submitContact = function(e){
  e.preventDefault();
  var btn=document.getElementById('ct-btn');
  if(btn){ btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Sending...'; }
  var db=getFirestore();
  var data={
    name:document.getElementById('ct-name')&&document.getElementById('ct-name').value,
    email:document.getElementById('ct-email')&&document.getElementById('ct-email').value,
    phone:document.getElementById('ct-phone')&&document.getElementById('ct-phone').value,
    subject:document.getElementById('ct-sub')&&document.getElementById('ct-sub').value,
    message:document.getElementById('ct-msg')&&document.getElementById('ct-msg').value
  };
  var done = function(){
    var s=document.getElementById('ct-succ'); if(s) s.style.display='flex';
    e.target.reset(); toast("Message sent! We'll reply within 2 hours 😊",'ok');
    if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Message'; }
  };
  var fail = function(){ toast('Send failed. Please call us directly.','err'); if(btn){ btn.disabled=false; btn.innerHTML='<i class="fas fa-paper-plane"></i> Send Message'; } };
  if(db){ db.collection('messages').add(Object.assign(data,{createdAt:firebase.firestore.FieldValue.serverTimestamp()})).then(done).catch(fail); }
  else { setTimeout(done, 800); }
};

/* ─── SHARED ─────────────────────────────────────────────── */
window.closeModal = function(id){
  var m=document.getElementById(id); if(m) m.classList.remove('show');
};
window.toggleSidebar = function(){
  var dsb=document.getElementById('dsb'); if(dsb) dsb.classList.toggle('open');
};
window.doLogout = doLogout;

document.addEventListener('click', function(e){
  if(e.target.classList.contains('modal-ov') || e.target.classList.contains('suc-modal')){
    e.target.classList.remove('show');
  }
});

/* ─── PRIVACY SCROLL ─────────────────────────────────────── */
function initPrivacy(){
  if(!qs('.pr-navl')) return;
  window.addEventListener('scroll', function(){
    var cur='';
    qsa('.pr-sec').forEach(function(s){ if(window.scrollY >= s.offsetTop - 90) cur=s.id; });
    qsa('.pr-navl a').forEach(function(a){ a.classList.toggle('on', a.getAttribute('href')==='#'+cur); });
  });
}

/* ─── INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  initHome();
  initPlanTrip();
  initTours();
  initCars();
  initBook();
  initDashboard();
  initPrivacy();
  // Admin tab listeners
  if(document.getElementById('adm-login')){
    qsa('.dn[data-tab]').forEach(function(n){
      n.addEventListener('click', function(e){ e.preventDefault(); switchATab(n.dataset.tab); });
    });
  }
  // Accordion for tours page
  qsa('.acc-hd').forEach(function(h){
    h.addEventListener('click', function(){
      var bd=h.nextElementSibling, isOpen=bd.classList.contains('open');
      qsa('.acc-hd').forEach(function(x){ x.classList.remove('open'); });
      qsa('.acc-bd').forEach(function(x){ x.classList.remove('open'); });
      if(!isOpen){ h.classList.add('open'); bd.classList.add('open'); }
    });
  });
});
