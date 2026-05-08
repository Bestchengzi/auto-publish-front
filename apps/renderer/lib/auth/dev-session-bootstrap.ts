const DEV_AUTH_STORAGE_KEY = "media-auto-publish-auth";

const DEV_AUTH_STORAGE_VALUE = {
  state: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMzkxYjBlNTdhYjE0YjYxODNjNjljMzM4NzA4NDU0ZCIsImlhdCI6MTc3Nzg3NTIxMSwiZXhwIjoxNzc4NDgwMDExfQ.Oodi7Ci85XIEGLJVZkDlfFmnAzPMYSp2Qgh_H1JpSRQ",
    user: {
      id: "b391b0e57ab14b6183c69c338708454d",
      name: "user_ozLzt6e-",
      create_at: "2026-04-10T14:47:00.653327",
      update_at: "2026-05-04T06:13:29.480766",
      three_party_identities: [
        {
          id: "18fe1a54879b461bb839aa377647428f",
          three_party_type: "wechat",
          three_party_open_id: "ozLzt6e-ek5Z9aml4CaPyHTtHLs4",
          three_party_scan: "auto_media_987b99b833db0b8f544d6043fa21b15f",
        },
      ],
    },
  },
  version: 0,
};

export const DEV_AUTH_SESSION_BOOTSTRAP_SCRIPT = `
try {
  window.localStorage.setItem(${JSON.stringify(
    DEV_AUTH_STORAGE_KEY,
  )}, ${JSON.stringify(JSON.stringify(DEV_AUTH_STORAGE_VALUE))});
  window.dispatchEvent(new Event("media-auth-changed"));
} catch {}
`;
