export default function Head() {
  const title = "TrackOps — Keep SBIRs, OTAs & ATOs on track";
  const desc  = "GovTech planning OS: WBS, calendar, Slack nudges. Metadata-only today; GCC High enclave tomorrow.";
  const url   = "https://yourdomain.com/landing";
  const ogImg = "https://yourdomain.com/og-trackops.png"; // drop one later

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImg} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImg} />
    </>
  );
}