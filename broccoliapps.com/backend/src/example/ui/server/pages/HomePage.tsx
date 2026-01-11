export type HomeProps = {
  title: string;
};

export const HomePage = ({}: HomeProps) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Broccoli Apps - Coming Soon</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>
          {`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e9 50%, #c8e6c9 100%);
            font-family: 'Nunito', sans-serif;
            padding: 2rem;
            text-align: center;
        }
        .container {
            max-width: 600px;
        }
        .broccoli-svg {
            width: 200px;
            height: 200px;
            margin-bottom: 2rem;
            animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .coming-soon {
            font-size: 0.9rem;
            font-weight: 600;
            color: #81c784;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 1rem;
        }
        h1 {
            font-size: 2.5rem;
            color: #2e7d32;
            margin-bottom: 1.5rem;
            line-height: 1.2;
        }
        .tagline {
            font-size: 1.1rem;
            color: #558b2f;
            margin-bottom: 1.5rem;
            font-weight: 600;
        }
        .description {
            font-size: 1.1rem;
            color: #555;
            line-height: 1.8;
        }
        .footer {
            margin-top: 3rem;
            font-size: 0.85rem;
            color: #888;
        }
        `}
        </style>
      </head>
      <body>
        <div class="container">
          <svg class="broccoli-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path d="M85 140 Q80 160 82 185 Q85 190 100 190 Q115 190 118 185 Q120 160 115 140" fill="#7cb342" />
            <path d="M88 145 Q90 165 90 180" stroke="#689f38" stroke-width="2" fill="none" stroke-linecap="round" />
            <path d="M112 145 Q110 165 110 180" stroke="#689f38" stroke-width="2" fill="none" stroke-linecap="round" />

            <ellipse cx="100" cy="95" rx="55" ry="50" fill="#4caf50" />
            <circle cx="65" cy="85" r="28" fill="#66bb6a" />
            <circle cx="100" cy="70" r="30" fill="#81c784" />
            <circle cx="135" cy="85" r="28" fill="#66bb6a" />
            <circle cx="78" cy="105" r="22" fill="#4caf50" />
            <circle cx="122" cy="105" r="22" fill="#4caf50" />
            <circle cx="100" cy="95" r="25" fill="#81c784" />

            <circle cx="55" cy="95" r="15" fill="#43a047" />
            <circle cx="145" cy="95" r="15" fill="#43a047" />
            <circle cx="70" cy="65" r="12" fill="#a5d6a7" />
            <circle cx="130" cy="65" r="12" fill="#a5d6a7" />
            <circle cx="100" cy="50" r="14" fill="#c8e6c9" />
            <circle cx="85" cy="55" r="10" fill="#a5d6a7" />
            <circle cx="115" cy="55" r="10" fill="#a5d6a7" />

            <ellipse cx="80" cy="90" rx="10" ry="12" fill="white" />
            <ellipse cx="120" cy="90" rx="10" ry="12" fill="white" />
            <ellipse cx="82" cy="92" rx="5" ry="6" fill="#333" />
            <ellipse cx="122" cy="92" rx="5" ry="6" fill="#333" />

            <circle cx="84" cy="89" r="2" fill="white" />
            <circle cx="124" cy="89" r="2" fill="white" />

            <ellipse cx="65" cy="105" rx="8" ry="5" fill="#f8bbd9" opacity="0.6" />
            <ellipse cx="135" cy="105" rx="8" ry="5" fill="#f8bbd9" opacity="0.6" />

            <path d="M85 110 Q100 125 115 110" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round" />

            <path d="M70 78 Q80 75 88 78" stroke="#2e7d32" stroke-width="2.5" fill="none" stroke-linecap="round" />
            <path d="M112 78 Q120 75 130 78" stroke="#2e7d32" stroke-width="2.5" fill="none" stroke-linecap="round" />
          </svg>

          <p class="coming-soon">Coming Soon</p>
          <h1>Broccoli Apps</h1>
          <p class="tagline">The healthy food aisle of software.</p>
          <p class="description">
            We build apps that nourish your mind instead of hijacking it. Our products avoid addictive mechanics and
            focus on meaningful utility, helping people live better, not scroll longer.
          </p>
          <p class="footer">Good things are growing 🥦</p>
        </div>
      </body>
    </html>
  );
};
