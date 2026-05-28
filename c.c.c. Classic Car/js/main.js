(function ($) {
    "use strict";

    // Intro 3D cover
    var intro = function () {
        var sparksHtml = '';
        for (var i = 1; i <= 14; i++) {
            sparksHtml += '<i class="site-intro-spark site-intro-spark-' + i + '"></i>';
        }

        var introHtml = '' +
            '<div class="site-intro" aria-label="Introducao C.C.C. Classic Car">' +
                '<img class="site-intro-bg" src="img/garage-intro.png" alt="Garagem C.C.C. Classic Car">' +
                '<img class="site-intro-logo-fallback" src="img/logo-clube-transparent.png" alt="Logo C.C.C. Classic Car">' +
                '<canvas class="site-intro-canvas" aria-hidden="true"></canvas>' +
                '<span class="site-intro-spark-field site-intro-spark-field-left" aria-hidden="true">' + sparksHtml + '</span>' +
                '<span class="site-intro-spark-field site-intro-spark-field-right" aria-hidden="true">' + sparksHtml + '</span>' +
                '<button class="site-intro-logo-hit" type="button" aria-label="Mover logo"></button>' +
                '<button class="site-intro-access" type="button">Acessar</button>' +
            '</div>';

        $('body').addClass('intro-open').prepend(introHtml);
        $('<link>', {
            rel: 'preload',
            as: 'image',
            href: 'img/logo-clube-transparent.png',
            crossorigin: 'anonymous'
        }).appendTo('head');
        initIntroCar();

        $('.site-intro-access').on('click', function () {
            $('.site-intro').addClass('is-leaving');
            $('body').removeClass('intro-open');

            setTimeout(function () {
                $('.site-intro').remove();
            }, 650);
        });
    };

    var initIntroCar = function () {
        var canvas = document.querySelector('.site-intro-canvas');

        if (!canvas || !window.WebGLRenderingContext) {
            return;
        }

        Promise.all([
            import('https://esm.sh/three@0.160.0')
        ]).then(function (modules) {
            var THREE = modules[0];
            var renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
            var textureLoader = new THREE.TextureLoader();
            var logoGroup = new THREE.Group();
            var logoCoin;
            var frameId;
            var motionPower = 0;
            var motionUntil = 0;
            var targetTiltX = 0;
            var targetTiltZ = 0;
            var startTime = Date.now();

            scene.add(logoGroup);
            scene.add(new THREE.AmbientLight(0xf2f2f0, 0.62));
            scene.add(new THREE.HemisphereLight(0xf2f2f0, 0x111111, 1.15));

            var keyLight = new THREE.DirectionalLight(0xfff4d0, 4.8);
            keyLight.position.set(4, 5, 6);
            scene.add(keyLight);

            var rimLight = new THREE.DirectionalLight(0xf4ed48, 3.6);
            rimLight.position.set(-5, 2, -4);
            scene.add(rimLight);

            var glintLight = new THREE.PointLight(0xffffff, 3.2, 14);
            glintLight.position.set(-1.7, 1.8, 3.2);
            scene.add(glintLight);

            camera.position.set(0, 0.12, 9.8);

            var resize = function () {
                var width = canvas.clientWidth;
                var height = canvas.clientHeight;

                renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
                renderer.setSize(width, height, false);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            };

            textureLoader.load('img/logo-clube-transparent.png', function (texture) {
                var fallbackLogo = document.querySelector('.site-intro-logo-fallback');
                var geometry = new THREE.CylinderGeometry(2.35, 2.35, 0.34, 128);
                var sideMaterial = new THREE.MeshStandardMaterial({
                    color: 0xc9c300,
                    metalness: 0.96,
                    roughness: 0.08,
                    envMapIntensity: 1.8
                });
                var faceMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    color: 0xffffff,
                    metalness: 0.48,
                    roughness: 0.14,
                    envMapIntensity: 1.45,
                    side: THREE.DoubleSide
                });
                logoCoin = new THREE.Mesh(geometry, [sideMaterial, faceMaterial, faceMaterial]);

                texture.colorSpace = THREE.SRGBColorSpace;
                texture.center.set(0.5, 0.5);
                texture.rotation = Math.PI / 2;
                logoCoin.rotation.x = Math.PI / 2;
                logoCoin.rotation.z = 0;
                logoCoin.position.z = -5.7;
                logoCoin.scale.setScalar(0.54);
                logoGroup.add(logoCoin);

                if (fallbackLogo) {
                    fallbackLogo.classList.add('is-hidden');
                }

                resize();
            }, undefined, function () {
                canvas.classList.add('is-hidden');
            });

            var logoHit = document.querySelector('.site-intro-logo-hit');

            if (logoHit) {
                var moveLogo = function (event) {
                    event.stopPropagation();
                    motionPower = 1;
                    motionUntil = Date.now() + 4200;
                };

                logoHit.addEventListener('click', moveLogo);
                logoHit.addEventListener('pointerdown', moveLogo);

                logoHit.addEventListener('pointermove', function (event) {
                    var rect = logoHit.getBoundingClientRect();
                    var x = ((event.clientX - rect.left) / rect.width) - 0.5;
                    var y = ((event.clientY - rect.top) / rect.height) - 0.5;

                    targetTiltX = y * 0.42;
                    targetTiltZ = -x * 0.36;
                });

                logoHit.addEventListener('pointerleave', function () {
                    targetTiltX = 0;
                    targetTiltZ = 0;
                });
            }

            var render = function () {
                if (!document.body.contains(canvas)) {
                    cancelAnimationFrame(frameId);
                    return;
                }
                if (logoCoin) {
                    var elapsed = (Date.now() - startTime) * 0.001;
                    var activeMotion = Date.now() < motionUntil;
                    var motionX = Math.sin(elapsed * 4.4) * motionPower;
                    var motionY = Math.cos(elapsed * 3.6) * motionPower;
                    var motionZ = Math.sin(elapsed * 5.2) * motionPower;
                    var baseFloat = Math.sin(elapsed * 1.5) * 0.05;

                    logoCoin.rotation.y += activeMotion ? 0.018 : 0.002;
                    logoCoin.rotation.x += ((Math.PI / 2) + targetTiltX + (motionY * 0.55) - logoCoin.rotation.x) * 0.14;
                    logoCoin.rotation.z += (targetTiltZ + (motionX * 0.52) - logoCoin.rotation.z) * 0.14;
                    logoCoin.position.x += ((motionX * 0.75) - logoCoin.position.x) * 0.12;
                    logoCoin.position.y += (baseFloat + (motionY * 0.48) - logoCoin.position.y) * 0.12;
                    logoCoin.position.z += (-5.7 + (motionZ * 0.5) - logoCoin.position.z) * 0.12;
                    motionPower = activeMotion ? 1 : Math.max(motionPower * 0.96, 0);
                }
                renderer.render(scene, camera);
                frameId = requestAnimationFrame(render);
            };

            render();

            window.addEventListener('resize', resize);
            resize();
        }).catch(function () {
            canvas.style.display = 'none';
        });
    };
    if (window.location.search.indexOf('skipIntro=1') === -1) {
        intro();
    }

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);


    // Initiate the wowjs
    new WOW().init();


   // Back to top button
   $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
        $('.back-to-top').fadeIn('slow');
    } else {
        $('.back-to-top').fadeOut('slow');
    }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });


    // Modal Video
    $(document).ready(function () {
        var $videoSrc;
        $('.btn-play').click(function () {
            $videoSrc = $(this).data("src");
        });
        console.log($videoSrc);

        $('#videoModal').on('shown.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
        })

        $('#videoModal').on('hide.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc);
        })
    });


    // Facts counter
    $('[data-toggle="counter-up"]').counterUp({
        delay: 10,
        time: 2000
    });


    // Testimonial carousel
    $(".testimonial-carousel-1").owlCarousel({
        loop: true,
        dots: false,
        margin: 25,
        autoplay: true,
        slideTransition: 'linear',
        autoplayTimeout: 0,
        autoplaySpeed: 10000,
        autoplayHoverPause: false,
        responsive: {
            0:{
                items:1
            },
            575:{
                items:1
            },
            767:{
                items:2
            },
            991:{
                items:3
            }
        }
    });

    $(".testimonial-carousel-2").owlCarousel({
        loop: true,
        dots: false,
        rtl: true,
        margin: 25,
        autoplay: true,
        slideTransition: 'linear',
        autoplayTimeout: 0,
        autoplaySpeed: 10000,
        autoplayHoverPause: false,
        responsive: {
            0:{
                items:1
            },
            575:{
                items:1
            },
            767:{
                items:2
            },
            991:{
                items:3
            }
        }
    });

})(jQuery);
