/**
 * Exporta todas las diapositivas de la presentación como imágenes png
 * en una carpeta junto a la propia presentación.
 * Utiliza el servicio avanzado de Slides, preferible a API REST dado que no precisa
 * proyecto en GCP, para obtener miniaturas de cada diapositiva, que
 * descarga por medio de su URL.
 * https://developers.google.com/slides/reference/rest/v1/presentations.pages/getThumbnail
 * Solo es una POC, ¡muy preliminar, sin control de errores!, quizás daría para un complemento GWS :-).
 * @OnlyCurrentDoc
 */

/* Exporta todas las diapos como png en carpeta de Drive junto a la presentación */
function exportarDiaposPngApi() {

  const t1 = new Date();
  
  const presentacion = SlidesApp.getActivePresentation(),
        idPresentacion = presentacion.getId(),
        diapos = presentacion.getSlides(),
        slidesComoPng = diapos.map(diapo => 
        Slides.Presentations.Pages.getThumbnail(idPresentacion, diapo.getObjectId(),
                                                {'thumbnailProperties.mimeType':'PNG', 'thumbnailProperties.thumbnailSize':'MEDIUM'}));

  // Preparar peticiones fetchAll
  const urls = slidesComoPng.map(diapo => {return {url: diapo.contentUrl}});

  // Obtener blobs (imágenes PNG) de cada diapositiva con fetch asíncronos
  const blobsImg = UrlFetchApp.fetchAll(urls).map(url => url.getBlob());
  
  console.info(blobsImg[0].getContentType());

  // Obtiene archivo de la presentación en Drive
  const presentacionDrive = DriveApp.getFileById(idPresentacion);

  // Establece nombre de la carpeta de exportación, se usa ID de presentación para identificarla
  const nombreCarpetaExp = `Miniaturas {${idPresentacion}}`;

  // Esta es la carpeta que contiene a la presentación original
  const carpeta  = presentacionDrive.getParents().next();

  // Si la carpeta de exportación ya existe la eliminamos para evitar duplicados
  if (carpeta.getFoldersByName(nombreCarpetaExp).hasNext()) {
    carpeta.getFoldersByName(nombreCarpetaExp).next().setTrashed(true);
  }

  // Crea carpeta de exportación
  const carpetaExp = carpeta.createFolder(nombreCarpetaExp);

  // Por fin, creamos imágenes a partir de los blobs obtenidos para cada diapo,
  // nombres precedidos por nº de diapositiva con relleno de 0s por la izquierda
  const nDigitos = parseInt(blobsImg.length.toString().length);
  blobsImg.forEach((blob, n) => {
    carpetaExp.createFile(blob.setName(`Diapositiva ${String(n + 1).padStart(nDigitos, '0')}`));
  });

  console.info(new Date() - t1);

  // Mensaje final
  SlidesApp.getUi().alert('✔️️ URL carpeta exportación:\n\n' + carpetaExp.getUrl());

}