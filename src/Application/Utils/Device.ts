const params = new URLSearchParams(window.location.search);

/**
 * Phone mode shows SeanOS as an app on a 3D phone instead of the desk scene.
 * Decided once at load: narrow screens get it, and `?phone` / `?desk` force
 * either mode (handy for testing on a laptop).
 */
export const isPhoneMode =
    params.has('phone') || (!params.has('desk') && window.innerWidth < 768);

/** Size of the SeanOS app inside the phone, in CSS pixels (= scene units). */
export const PHONE_SCREEN = { w: 375, h: 812, radius: 46 };

/** Bezel around the screen and the phone's thickness, in scene units. */
export const PHONE_BODY = { bezel: 13, radius: 58, depth: 30, bevel: 6 };

/** Outer size of the phone body, used to fit the camera. */
export const PHONE_OUTER = {
    w: PHONE_SCREEN.w + PHONE_BODY.bezel * 2 + PHONE_BODY.bevel * 2,
    h: PHONE_SCREEN.h + PHONE_BODY.bezel * 2 + PHONE_BODY.bevel * 2,
};
