exports.handler = async (event) => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  const mainFolder = process.env.MAIN_FOLDER_ID;
  const folderId = event.queryStringParameters?.folderId || mainFolder;

  if (!apiKey || !folderId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falta configurar GOOGLE_DRIVE_API_KEY ou MAIN_FOLDER_ID no Netlify.' })
    };
  }

  // Procura tanto subpastas como imagens dentro da pasta atual
  const query = `'${folderId}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/') and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,thumbnailLink)&orderBy=folder,name desc&pageSize=1000&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const items = (data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      isFolder: f.mimeType === 'application/vnd.google-apps.folder',
      preview: f.thumbnailLink ? f.thumbnailLink.replace('=s220', '=s800') : '',
      download: `https://drive.google.com/uc?export=download&id=${f.id}`
    }));

    return { statusCode: 200, body: JSON.stringify(items) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
