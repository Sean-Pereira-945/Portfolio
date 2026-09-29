import React, { useCallback, useEffect, useRef, useState } from 'react';
import eventBus from '../EventBus';
import { prefersReducedMotion } from '../Animation';
import { isPhoneMode } from '../../Utils/Device';

// The in-monitor SeanOS page also works on its own, without WebGL.
const LIGHTWEIGHT_URL = './os/index.html';

type LoadingProps = {};

const LoadingScreen: React.FC<LoadingProps> = () => {
    const [progress, setProgress] = useState(0);
    const [toLoad, setToLoad] = useState(0);
    const [loaded, setLoaded] = useState(0);
    const [overlayOpacity, setLoadingOverlayOpacity] = useState(1);
    const [loadingTextOpacity, setLoadingTextOpacity] = useState(1);
    const [startPopupOpacity, setStartPopupOpacity] = useState(0);
    const [firefoxPopupOpacity, setFirefoxPopupOpacity] = useState(0);
    const [webGLErrorOpacity, setWebGLErrorOpacity] = useState(0);

    const [showBiosInfo, setShowBiosInfo] = useState(false);
    const [showLoadingResources, setShowLoadingResources] = useState(false);
    const [doneLoading, setDoneLoading] = useState(false);
    const [webGLError, setWebGLError] = useState(false);
    const [counter, setCounter] = useState(0);
    const [resources] = useState<string[]>([]);
    const [mobileWarning, setMobileWarning] = useState(window.innerWidth < 768);
    const startedRef = useRef(false);
    const startButtonRef = useRef<HTMLButtonElement>(null);
    const reducedMotion = prefersReducedMotion();

    useEffect(() => {
        const onResize = () => setMobileWarning(window.innerWidth < 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            start();
        } else if (!detectWebGLContext()) {
            setWebGLError(true);
        } else {
            setShowBiosInfo(true);
        }
    }, []);

    useEffect(() => {
        eventBus.on('loadedSource', (data) => {
            setProgress(data.progress);
            setToLoad(data.toLoad);
            setLoaded(data.loaded);
            resources.push(
                `Loaded ${data.sourceName}${getSpace(
                    data.sourceName
                )} ... ${Math.round(data.progress * 100)}%`
            );
            if (resources.length > 8) {
                resources.shift();
            }
        });
    }, []);

    useEffect(() => {
        setShowLoadingResources(true);
        setCounter(counter + 1);
    }, [loaded]);

    useEffect(() => {
        if (progress >= 1 && !webGLError) {
            setDoneLoading(true);

            setTimeout(() => {
                setLoadingTextOpacity(0);
                setTimeout(() => {
                    setStartPopupOpacity(1);
                }, 500);
            }, 1000);
        }
    }, [progress]);

    useEffect(() => {
        if (webGLError) {
            setTimeout(() => {
                setWebGLErrorOpacity(1);
            }, 500);
        }
    }, [webGLError]);

    const start = useCallback(() => {
        if (startedRef.current) return;
        startedRef.current = true;
        setLoadingOverlayOpacity(0);
        eventBus.dispatch('loadingScreenDone', {});
        const ui = document.getElementById('ui');
        if (ui) {
            ui.style.pointerEvents = 'none';
        }
    }, []);

    useEffect(() => {
        if (startPopupOpacity !== 1) return;
        startButtonRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (startedRef.current) return;
            if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault();
                start();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [startPopupOpacity, start]);

    const getSpace = (sourceName: string) => {
        let spaces = '';
        for (let i = 0; i < 24 - sourceName.length; i++) spaces += '\xa0';
        return spaces;
    };

    const getCurrentDate = () => {
        const date = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        // add leading zero
        const monthFormatted = month < 10 ? `0${month}` : month;
        const dayFormatted = day < 10 ? `0${day}` : day;
        return `${monthFormatted}/${dayFormatted}/${year}`;
    };

    const detectWebGLContext = () => {
        var canvas = document.createElement('canvas');

        // Get WebGLRenderingContext from canvas element.
        var gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');
        // Report the result.
        if (gl && gl instanceof WebGLRenderingContext) {
            return true;
        }
        return false;
    };

    return (
        <div
            style={Object.assign({}, styles.overlay, {
                opacity: overlayOpacity,
                transform: `scale(${
                    overlayOpacity === 0 && !reducedMotion ? 1.1 : 1
                })`,
                // Once faded out, take the overlay (and its START button) out of the tab order.
                visibility: overlayOpacity === 0 ? 'hidden' : 'visible',
            })}
        >
            {startPopupOpacity === 0 && loadingTextOpacity === 0 && (
                <div style={styles.blinkingContainer}>
                    <span className="blinking-cursor" />
                </div>
            )}
            {!webGLError && (
                <div
                    style={Object.assign({}, styles.overlayText, {
                        opacity: loadingTextOpacity,
                    })}
                >
                    <div
                        style={styles.header}
                        className="loading-screen-header"
                    >
                        <div style={styles.logoContainer}>
                            <div>
                                <p style={styles.green}>
                                    <b>Pereira,</b>{' '}
                                </p>
                                <p style={styles.green}>
                                    <b>Sean Labs.</b>
                                </p>
                            </div>
                        </div>
                        <div className="loading-screen-header-info">
                            <p>Released: 05/01/2027</p>
                            <p>SPBIOS (C)2026 Pereira Signal Labs,</p>
                        </div>
                    </div>
                    <div style={styles.body} className="loading-screen-body">
                        <p>SPL S13 2018-2026 Telecom Research Stack</p>
                        <div style={styles.spacer} />
                        {showBiosInfo && (
                            <>
                                <p>SPL Showcase(tm) CRCE-945</p>
                                <p>Checking RAM : {16000} OK</p>
                                <div style={styles.spacer} />
                                <div style={styles.spacer} />
                                {showLoadingResources ? (
                                    progress == 1 ? (
                                        <p>FINISHED LOADING RESOURCES</p>
                                    ) : (
                                        <p className="loading">
                                            LOADING RESOURCES ({loaded}/
                                            {toLoad === 0 ? '-' : toLoad})
                                        </p>
                                    )
                                ) : (
                                    <p className="loading">WAIT</p>
                                )}
                            </>
                        )}
                        <div style={styles.spacer} />
                        <div style={styles.resourcesLoadingList}>
                            {resources.map((sourceName) => (
                                <p key={sourceName}>{sourceName}</p>
                            ))}
                        </div>
                        <div style={styles.spacer} />
                        {showLoadingResources && doneLoading && (
                            <p>
                                All Content Loaded, launching{' '}
                                <b style={styles.green}>
                                    'Sean Pereira Immersive Portfolio'
                                </b>{' '}
                                V1.0
                            </p>
                        )}
                        <div style={styles.spacer} />
                        <span className="blinking-cursor" />
                    </div>
                    <div
                        style={styles.footer}
                        className="loading-screen-footer"
                    >
                        <p>
                            Press <b>ENTER</b> or <b>ESC</b> to boot once
                            loading completes
                        </p>
                        <p>{getCurrentDate()}</p>
                    </div>
                </div>
            )}
            <div
                style={Object.assign({}, styles.popupContainer, {
                    opacity: startPopupOpacity,
                })}
            >
                <div style={styles.startPopup}>
                    {/* <p style={styles.red}>
                        <b>THIS SITE IS CURRENTLY A W.I.P.</b>
                    </p>
                    <p>But do enjoy what I have done so far :)</p>
                    <div style={styles.spacer} />
                    <div style={styles.spacer} /> */}
                    <p>Sean Pereira Immersive Portfolio 2026</p>
                    {mobileWarning && !isPhoneMode && (
                        <>
                            <br />
                            <b>
                                <p style={styles.warning}>
                                    WARNING: This experience is best viewed on
                                </p>
                                <p style={styles.warning}>
                                    a desktop or laptop computer.
                                </p>
                            </b>
                            <p>
                                On a phone?{' '}
                                <a href={LIGHTWEIGHT_URL} style={styles.link}>
                                    Open the lightweight version
                                </a>
                            </p>
                            <br />
                        </>
                    )}
                    {isPhoneMode && (
                        <>
                            <p>
                                Prefer a lighter page?{' '}
                                <a href={LIGHTWEIGHT_URL} style={styles.link}>
                                    Open the plain version
                                </a>
                            </p>
                            <br />
                        </>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <p>
                            {isPhoneMode ? 'Tap' : 'Click'} start to begin
                            {'\xa0'}
                        </p>
                        <span className="blinking-cursor" />
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '16px',
                        }}
                    >
                        <button
                            type="button"
                            className="bios-start-button"
                            onClick={start}
                            ref={startButtonRef}
                            tabIndex={startPopupOpacity === 1 ? 0 : -1}
                        >
                            <p>START</p>
                        </button>
                    </div>
                </div>
            </div>
            {webGLError && (
                <div
                    style={Object.assign({}, styles.popupContainer, {
                        opacity: webGLErrorOpacity,
                    })}
                >
                    <div style={styles.startPopup}>
                        <p>
                            <b style={styles.red}>CRITICAL ERROR:</b> No
                            WebGL Detected
                        </p>
                        <div style={styles.spacer} />
                        <div style={styles.spacer} />

                        <p>WebGL is required to run this site.</p>
                        <p>
                            Please enable it or switch to a browser which
                            supports WebGL, or{' '}
                            <a href={LIGHTWEIGHT_URL} style={styles.link}>
                                open the lightweight version
                            </a>
                            .
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    overlay: {
        backgroundColor: 'var(--bios-bg)',
        width: '100%',
        height: '100%',
        display: 'flex',
        transition: 'opacity 0.2s, transform 0.2s, visibility 0s 0.2s',

        transitionTimingFunction: 'ease-in-out',

        boxSizing: 'border-box',
        fontSize: 16,
        letterSpacing: 0.8,
    },

    spacer: {
        height: 16,
    },
    header: {
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'row',
    },
    popupContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    warning: {
        color: 'var(--bios-warning)',
    },
    blinkingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        boxSizing: 'border-box',
        padding: 48,
    },
    startPopup: {
        backgroundColor: 'var(--bios-bg)',
        padding: 24,
        border: '7px solid var(--bios-fg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: 500,
        // alignItems: 'center',
    },
    green: {
        color: 'var(--bios-green)',
    },
    red: {
        color: 'var(--bios-error)',
    },
    link: {
        color: 'var(--bios-link)',
        cursor: 'pointer',
        textUnderlineOffset: '0.2em',
    },
    overlayText: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    body: {
        flex: 1,
        display: 'flex',
        width: '100%',
        boxSizing: 'border-box',
        flexDirection: 'column',
    },
    logoContainer: {
        display: 'flex',
        flexDirection: 'row',
    },
    resourcesLoadingList: {
        display: 'flex',
        paddingLeft: 32,
        paddingBottom: 32,
        flexDirection: 'column',
    },
    footer: {
        boxSizing: 'border-box',
        width: '100%',
    },
};

export default LoadingScreen;
