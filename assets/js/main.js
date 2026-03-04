// Zmienne Globalne
var time = 0;
var pts;
var gameStart = false;
var gameID;
var timerID;
var randomTime;
var listNicknamesPts = {};

// Zmienne Stale
const BULLET_IMG = 'assets/images/bullet.png';
const BULLET_COUNT = 15;
const MAX_TIME = 20;
const COUNT_BOSS = Math.floor(MAX_TIME / 20) * 2;
const RELOAD_SOUND = new Audio('assets/sounds/gun-reaload.mp3');
const GUNSHOT_SOUND = new Audio('assets/sounds/shot.mp3');
const PTS_WIN = 180;
const BOSS_PTS = 20;
const MONSTER_PTS = 10;
const ROCK_PTS = 5;
const BLOCK_PTS = 5;
const WATER_PTS = 5;
const WOOD_PTS = 5;

// Init
$(document).ready(function() {
    setTime(time);
    renderMag(BULLET_COUNT);

    let ammo = BULLET_COUNT;

    // Reload
    $(document).on('contextmenu', function(e) {
        RELOAD_SOUND.play();
        ammo = BULLET_COUNT;
        renderMag(BULLET_COUNT, ammo);
        e.preventDefault();
    });

    // Shoot
    $('.stage').on('mousedown', function(event) {
        if (event.button !== 0) return;
        if (ammo <= 0) return false;

        ammo--;
        renderMag(BULLET_COUNT, ammo);
        shoot();
    });

    // Trafienie w potwora
	$('.monster').click(function() {
		if (!$(this).hasClass('shoot')) {
			if (ammo > 0) {
				if ($(this).hasClass('boss')) {
					pts += BOSS_PTS;
				} else {
					pts += MONSTER_PTS;
				}
			}
			if ($(this).hasClass('boss')) {
				hideBoss($(this));
			} else {
				$(this).find('img').attr('src', 'assets/images/monster.png');
				$(this).removeClass('visible').addClass('shoot');
			}
			setPts(pts);
			showPts(pts);
		}
	});

    // Trafienie w przeszkodę (kara punktowa)
    $('.rock, .block, .water, .wood').click(function() {
        if($(this).hasClass('rock')) pts -= ROCK_PTS;
        if($(this).hasClass('block')) pts -= BLOCK_PTS;
        if($(this).hasClass('water')) pts -= WATER_PTS;
        if($(this).hasClass('wood')) pts -= WOOD_PTS;
        setPts(pts);
        showPts(pts);
    });

	// UI

    $('#btn-game-info').click(() => {
        $('#game-info').slideToggle();
    });

    // Nowa gra
    $('#btn-game-renew').click(() => {
		clearInterval(gameID);
		clearInterval(timerID);
        $('#nickname').show().val('');
        $('#btn-game-start').show();
        $('#btn-game-renew').hide();
        $('.overlay-content .table-container').hide();
        $('.title').text('New Game');
        $('.result').text('Podaj swojego nicka');
        localStorage.removeItem('pts');
        localStorage.removeItem('nickname');
    });

    // Start gry
    $('#btn-game-start').click(() => {
        const nicknameVal = $('#nickname').val();

        if (nicknameVal === '') return;

        if (localStorage.getItem('list') !== null) {
            listNicknamesPts = JSON.parse(localStorage.getItem('list'));
        }

        if (listNicknamesPts[nicknameVal] == undefined) {
            setNickname(nicknameVal);
            listNicknamesPts[nicknameVal] = 0;
            localStorage.setItem('list', JSON.stringify(listNicknamesPts));
        } else {
            $('.result').text('Taki nick juz byl');
            return;
        }

        $('#nickname').hide();
        $('.overlay').css('display', 'none');

        gameStart = true;
        time = MAX_TIME;
        pts = 0;
		ammo = BULLET_COUNT;
        setPts(pts);
        setTime(time);
        randomTime = generateRandomTime(COUNT_BOSS, time);

        gameID = startMonster();
        timerID = startTimer();
        renderMag(BULLET_COUNT);
        showPts(pts);
    });
});

// Logika gry

function startMonster() {
    return setInterval(function() {
        let rnd = Math.floor((Math.random() * 6) + 1);
        let $monster = $('.monster-' + rnd);

        if ($monster.hasClass('boss')) return;
        if ($monster.hasClass('shoot')) {
            $monster.removeClass('shoot');
            return; 
        }

        $monster.toggleClass('visible');
    }, 350);
}

function startTimer() {
    return setInterval(function() {
        if (gameStart) {
            time--;
            showBoss(time);
            setTime(time);
        } else {
            clearInterval(timerID);
        }

        if (time <= 0) {
            clearInterval(timerID);
            clearInterval(gameID);
            gameEnd();
        }
    }, 1000);
}

function gameEnd() {
	gameStart = false;
    clearInterval(gameID);
    clearInterval(timerID);
	$('.monster').removeClass('visible boss');
    $('.monster').find('img').attr('src', 'assets/images/monster.png');
    $('.monster').removeClass('visible');

    let pts = getPts();
    let nickname = getNickname();

    $('#btn-game-renew').show();
    $('#btn-game-start').hide();

    if (localStorage.getItem('list') !== null) {
        listNicknamesPts = JSON.parse(localStorage.getItem('list'));
    }

    listNicknamesPts[nickname] = parseInt(pts) + parseInt(listNicknamesPts[nickname]);
    localStorage.setItem('list', JSON.stringify(listNicknamesPts));

    $('.title').text('Wynik: ' + pts + ' | Twoj nick: ' + nickname);
    $('.result').text(pts >= PTS_WIN ? 'WYGRAŁEŚ!' : 'SPROBUJ JESZCZE RAZ!');

    renderTable();
    $('.overlay').css('display', 'flex');
}

function showBoss(time) {
    for (let i = 0; i < randomTime.length; i++) {
        if (time == randomTime[i]) {
            let available = [];
            $('.monster').each(function(index) {
                if (!$(this).hasClass('visible') && !$(this).hasClass('boss')) {
                    available.push(index + 1);
                }
            });

            if (available.length === 0) return;

            let rnd = available[Math.floor(Math.random() * available.length)];
            let $boss = $('.monster-' + rnd);

            $boss.find('img').attr('src', 'assets/images/monsterMega.png');
            $boss.addClass('boss visible');

            setTimeout(function() {
                if ($boss.hasClass('boss')) {
                    hideBoss($boss);
                }
            }, 1500);
        }
    }
}

function generateRandomTime(count, time) {
    let times = [];
    while (times.length < count) {
        let rnd = Math.floor(Math.random() * (time - 4)) + 3;
        if (!times.includes(rnd)) {
            times.push(rnd);
        }
    }
    console.log(times);
    return times;
}

// LocalStorage

function getPts() {
    return localStorage.getItem('pts');
}

function setPts(pts) {
    localStorage.setItem('pts', pts);
}

function getNickname() {
    return localStorage.getItem('nickname');
}

function setNickname(nickname) {
    localStorage.setItem('nickname', nickname);
}

function getUserPts() {
    let userList = JSON.parse(localStorage.getItem('list'));
    return userList[getNickname()];
}

// Render

function shoot() {
    GUNSHOT_SOUND.play();
    $('body').addClass('mouse-shot');
    setTimeout(function() {
        $('body').removeClass('mouse-shot');
    }, 10);
}

function setTime(time) {
    if(time >= 60) {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        $('.time > span').text(minutes + ':' + seconds);
    } else {
        if(time < 10) {
            $('.time > span').text('0' + time);
        } else if (time == 0) {
            $('.time > span').text('0:00');
        }else {
            $('.time > span').text(time);
        }
    }
}

function showPts(pts) {
    $('.score > span').text(pts);
}

function renderMag(BULLET_COUNT = 15, ammo = BULLET_COUNT) {
    let html = '';
    for (var i = 0; i < BULLET_COUNT; i++) {
        let bulletClass = i >= ammo ? ' used' : '';
        html += '<img class="bullet' + bulletClass + '" src="' + BULLET_IMG + '" />';
    }
    $('.ammo').html(html);
    if (ammo === 0) alert('Reload');
}

function hideBoss($boss) {
    $boss.find('img').attr('src', 'assets/images/monster.png');
    $boss.removeClass('boss visible shoot');
}

function renderTable() {
    let html = '';
    if (localStorage.getItem('list') !== null) {
        listNicknamesPts = JSON.parse(localStorage.getItem('list'));
    }

    let sorted = Object.keys(listNicknamesPts).sort((a, b) => listNicknamesPts[b] - listNicknamesPts[a]);

    for (var i = 0; i < sorted.length; i++) {
        let nick = sorted[i];
        let isCurrentPlayer = nick === getNickname();
        let rowClass = isCurrentPlayer ? ' class="current-player"' : '';
        html += '<tr' + rowClass + '><td>' + (i + 1) + '</td><td>' + nick + '</td><td>' + listNicknamesPts[nick] + '</td></tr>';
    }

    $('.overlay-content .table-container').show();
    $('.overlay-content table tbody').html(html);
}