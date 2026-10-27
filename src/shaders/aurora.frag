precision highp float;


uniform float uTime;

uniform vec2 uResolution;

uniform vec2 uMouse;

uniform float uTheme;


varying vec2 vUv;



/* =========================================================
   RANDOM
========================================================= */

float hash21(vec2 p) {

    p = fract(
        p *
        vec2(
            123.34,
            345.45
        )
    );


    p += dot(
        p,
        p + 34.345
    );


    return fract(
        p.x *
        p.y
    );
}



/* =========================================================
   NOISE
========================================================= */

float noise(vec2 p) {

    vec2 i =
        floor(p);


    vec2 f =
        fract(p);


    f =
        f *
        f *
        (
            3.0 -
            2.0 *
            f
        );


    float a =
        hash21(i);


    float b =
        hash21(
            i +
            vec2(
                1.0,
                0.0
            )
        );


    float c =
        hash21(
            i +
            vec2(
                0.0,
                1.0
            )
        );


    float d =
        hash21(
            i +
            vec2(
                1.0,
                1.0
            )
        );


    return mix(
        mix(
            a,
            b,
            f.x
        ),

        mix(
            c,
            d,
            f.x
        ),

        f.y
    );
}



/* =========================================================
   FBM
========================================================= */

float fbm(vec2 p) {

    float value =
        0.0;


    float amplitude =
        0.5;


    for (
        int i = 0;
        i < 5;
        i++
    ) {

        value +=
            noise(p) *
            amplitude;


        p *=
            2.03;


        amplitude *=
            0.5;
    }


    return value;
}



/* =========================================================
   MAIN
========================================================= */

void main() {

    vec2 uv =
        vUv;


    vec2 centered =
        uv -
        0.5;


    float aspect =
        uResolution.x /
        max(
            uResolution.y,
            1.0
        );


    centered.x *=
        aspect;



    /* =====================================================
       MOUSE INFLUENCE
    ====================================================== */

    vec2 mouse =
        uMouse -
        0.5;


    mouse.x *=
        aspect;


    float mouseDistance =
        length(
            centered -
            mouse
        );


    float mouseGlow =
        exp(
            -mouseDistance *
            3.4
        );



    /* =====================================================
       FLOW
    ====================================================== */

    float time =
        uTime *
        0.075;


    vec2 flowUv =
        centered *
        1.55;


    flowUv.x +=
        sin(
            flowUv.y *
            2.0 +
            time *
            2.0
        ) *
        0.18;


    flowUv.y +=
        cos(
            flowUv.x *
            1.7 -
            time
        ) *
        0.13;


    float flow =
        fbm(
            flowUv +
            vec2(
                time,
                -time * 0.65
            )
        );



    /* =====================================================
       AURORA BANDS
    ====================================================== */

    float bandOne =
        sin(
            centered.x *
            2.8 +
            flow *
            3.2 +
            time *
            2.0
        );


    bandOne =
        smoothstep(
            0.15,
            1.0,
            bandOne
        );


    float bandTwo =
        cos(
            centered.x *
            2.1 -
            centered.y *
            1.6 +
            flow *
            4.0 -
            time *
            1.4
        );


    bandTwo =
        smoothstep(
            0.25,
            1.0,
            bandTwo
        );



    /* =====================================================
       COLORS
    ====================================================== */

    vec3 cyan =
        vec3(
            0.13,
            0.82,
            0.92
        );


    vec3 blue =
        vec3(
            0.18,
            0.45,
            1.0
        );


    vec3 violet =
        vec3(
            0.44,
            0.25,
            1.0
        );


    vec3 pink =
        vec3(
            1.0,
            0.20,
            0.50
        );


    vec3 darkColor =
        mix(
            cyan,
            violet,
            flow
        );


    darkColor =
        mix(
            darkColor,
            blue,
            bandOne *
            0.45
        );


    darkColor +=
        pink *
        bandTwo *
        0.13;



    vec3 lightColor =
        mix(
            vec3(
                0.10,
                0.54,
                0.67
            ),

            vec3(
                0.35,
                0.42,
                0.90
            ),

            flow
        );



    vec3 color =
        mix(
            darkColor,
            lightColor,
            uTheme
        );



    /* =====================================================
       PARTICLE-LIKE POINTS
    ====================================================== */

    vec2 starGrid =
        floor(
            uv *
            vec2(
                145.0,
                90.0
            )
        );


    float star =
        hash21(
            starGrid
        );


    star =
        step(
            0.996,
            star
        );


    float sparkle =
        star *
        (
            0.35 +
            0.65 *
            sin(
                uTime *
                0.2 +
                hash21(
                    starGrid +
                    4.0
                ) *
                6.2831
            ) *
            0.5 +
            0.5
        );



    color +=
        sparkle *
        vec3(
            0.30,
            0.70,
            1.0
        ) *
        (
            1.0 -
            uTheme *
            0.55
        );



    color +=
        cyan *
        mouseGlow *
        0.11;



    /* =====================================================
       EDGE FADE
    ====================================================== */

    float vignette =
        1.0 -
        smoothstep(
            0.25,
            0.95,
            length(centered)
        );


    float auroraStrength =
        (
            flow *
            0.40 +
            bandOne *
            0.15 +
            bandTwo *
            0.09 +
            mouseGlow *
            0.08
        ) *
        vignette;

    // Wide, diffused shafts provide a slow key light rather than sharp beams.
    float lightDrift = sin(time * 0.28) * 0.045;
    float keyLight = exp(-pow((uv.x + uv.y * 0.32 - 0.91 - lightDrift) / 0.22, 2.0));
    keyLight *= smoothstep(0.05, 0.95, uv.y);
    float rimLight = exp(-pow((uv.x - uv.y * 0.20 - 0.10 + lightDrift) / 0.18, 2.0));
    rimLight *= 1.0 - smoothstep(0.45, 1.0, uv.y);
    color = mix(color, mix(blue, cyan, 0.62), keyLight * 0.22);
    color = mix(color, violet, rimLight * 0.20);



    float alphaDark =
        auroraStrength *
        0.42 + keyLight * 0.12 + rimLight * 0.08;


    float alphaLight =
        auroraStrength *
        0.22 + keyLight * 0.04 + rimLight * 0.025;


    float alpha =
        mix(
            alphaDark,
            alphaLight,
            uTheme
        );


    gl_FragColor =
        vec4(
            color,
            alpha
        );
}
