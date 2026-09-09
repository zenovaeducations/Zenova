* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --purple: #7c3aed;
    --purple-dark: #6d28d9;

    --black: #111111;
    --text: #222222;

    --muted: #777777;

    --border: #e7e7e7;

    --soft: #f7f7f7;

    --error-bg: #fff5f5;
    --error-text: #b42318;

    --success-bg: #f3faf5;
    --success-text: #216e39;
}

html,
body {
    width: 100%;
    min-height: 100%;
}

body {
    background: #ffffff;

    color: var(--text);

    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Helvetica,
        Arial,
        sans-serif;

    -webkit-font-smoothing: antialiased;
}

button {
    font: inherit;
}

.page {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;

    display: flex;
    justify-content: center;

    background: #ffffff;
}

.container {
    width: 100%;
    max-width: 460px;

    min-height: 100vh;
    min-height: 100dvh;

    padding: 42px 24px 28px;

    display: flex;
    flex-direction: column;
}

.brand {
    margin-bottom: 54px;
}

.brand img {
    width: 54px;
    height: 54px;

    object-fit: contain;
}

.state {
    display: none;
}

.state.active {
    display: block;
}

.state h1 {
    color: var(--black);

    font-size: 29px;
    line-height: 1.15;

    letter-spacing: -0.7px;

    font-weight: 700;

    margin-bottom: 12px;
}

.subtitle {
    color: var(--muted);

    font-size: 15px;
    line-height: 1.55;

    margin-bottom: 30px;
}


/* Loading */

.loading-state {
    text-align: center;
    padding-top: 40px;
}

.loader {
    width: 62px;
    height: 62px;

    margin: 0 auto 26px;

    border-radius: 50%;

    border: 2px solid #eeeeee;

    border-top-color: var(--purple);

    animation: spin 0.9s linear infinite;
}

.loading-state h1 {
    font-size: 23px;
}


/* Icons */

.check-icon,
.new-icon,
.error-icon {
    width: 52px;
    height: 52px;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 25px;

    font-size: 24px;
    font-weight: 700;
}

.check-icon {
    background: var(--success-bg);
    color: var(--success-text);
}

.new-icon {
    background: #f5f3ff;
    color: var(--purple);
}

.error-icon {
    background: var(--error-bg);
    color: var(--error-text);
}


/* Student card */

.student-card {
    width: 100%;

    display: flex;
    align-items: center;

    gap: 14px;

    padding: 17px;

    margin-bottom: 20px;

    border: 1px solid var(--border);

    border-radius: 14px;

    background: #ffffff;
}

.avatar {
    width: 46px;
    height: 46px;

    flex-shrink: 0;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    background: #f3f3f3;

    color: var(--black);

    font-size: 18px;
    font-weight: 700;
}

.student-info {
    min-width: 0;
}

.student-name {
    font-size: 16px;
    font-weight: 700;

    color: var(--black);

    margin-bottom: 4px;
}

.student-phone {
    font-size: 13px;

    color: var(--muted);
}


/* Phone confirmation */

.phone-confirmation {
    width: 100%;

    padding: 16px;

    margin-bottom: 20px;

    border-radius: 12px;

    background: var(--soft);
}

.phone-confirmation span {
    display: block;

    font-size: 12px;

    color: var(--muted);

    margin-bottom: 5px;
}

.phone-confirmation strong {
    font-size: 15px;

    color: var(--black);
}


/* Buttons */

.primary-button {
    width: 100%;
    height: 56px;

    border: none;
    border-radius: 12px;

    background: var(--purple);
    color: #ffffff;

    font-size: 15px;
    font-weight: 700;

    cursor: pointer;

    transition:
        background 0.2s ease,
        opacity 0.2s ease,
        transform 0.1s ease;
}

.primary-button:hover {
    background: var(--purple-dark);
}

.primary-button:active {
    transform: scale(0.99);
}

.primary-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.secondary-button {
    width: 100%;
    height: 52px;

    margin-top: 10px;

    border: 1px solid var(--border);
    border-radius: 12px;

    background: #ffffff;

    color: var(--black);

    font-size: 14px;
    font-weight: 600;

    cursor: pointer;
}

.text-button {
    width: 100%;

    margin-top: 20px;

    border: none;

    background: transparent;

    color: var(--muted);

    font-size: 13px;
    font-weight: 600;

    cursor: pointer;
}


/* Messages */

.message {
    display: none;

    margin-top: 14px;

    padding: 12px 14px;

    border-radius: 10px;

    font-size: 13px;

    line-height: 1.45;
}

.message.show {
    display: block;
}

.message.error {
    background: var(--error-bg);
    color: var(--error-text);
}


/* Footer */

footer {
    margin-top: auto;

    padding-top: 50px;

    text-align: center;

    color: #a0a0a0;

    font-size: 12px;
}


/* Animation */

@keyframes spin {

    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }

}


/* Mobile */

@media (max-width: 380px) {

    .container {
        padding-left: 20px;
        padding-right: 20px;
    }

    .state h1 {
        font-size: 26px;
    }

}
