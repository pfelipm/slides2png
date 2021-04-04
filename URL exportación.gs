/**
 * Exporta todas las diapositivas de la presentación como imágenes png
 * en una carpeta junto a la propia presentación.
 * Solo es una POC, ¡muy preliminar, sin control de errores!, quizás daría para un complemento GWS :-).
 * Mejora: utilizar API o servicio avanzado (preferible) Slides para obtener miniaturas de cada diapositiva
 * de un modo más limpio y configurable:
 * https://developers.google.com/slides/reference/rest/v1/presentations.pages/getThumbnail
 */

/* Crear menú del script */
function onOpen() {
  SlidesApp.getUi().createMenu('🖼️ Slides2PNG')
    .addItem('📥 Exportar diapositivas como PNG (v1 URL)', 'exportarDiaposPngUrl')
    .addItem('📥 Exportar diapositivas como PNG (v2 API)', 'exportarDiaposPngApi')
    .addToUi();
}

/* Exporta todas las diapos como png en carpeta de Drive junto a la presentación */
function exportarDiaposPngUrl() {

  // Tiempo inicial
  const t1 = new Date();

  // Obtiene copia auxiliar de la presentación, no parece ser posible actuar directamente
  // sobre la original por falta de actualización del orden de las diapositivas
  const presentacion = SlidesApp.getActivePresentation();
  const idPresentacion = presentacion.getId();
  const archivoAux = DriveApp.getFileById(idPresentacion).makeCopy();
  const idPresentacionAux = archivoAux.getId();

  // URL "mágico" para la exportación PNG, ¡incluyendo token Oauth propio!, visto en 
  // https://tanaikech.github.io/2018/12/14/summarizing-slides-as-thumbnails/
  const url = `https://docs.google.com/presentation/d/${idPresentacionAux}/export/png?access_token=${ScriptApp.getOAuthToken()}`;

  // Obtiene diapositivas de la presentación auxiliar
  let presentacionAux = SlidesApp.openById(idPresentacionAux);
  let diapos = presentacionAux.getSlides();
  
  // Obtener blobs (imágenes PNG) de cada diapositiva
  const blobsImg = diapos.map(diapo => {
    
    const blobImg = UrlFetchApp.fetch(url).getBlob();

    // Este truqui solo exporta la 1ª diapo, así que las vamos moviendo al final 😎 
    diapos[0].move(diapos.length);

    // Ahora hay que cerrar la presentación para que el cambio de posición tenga efecto...
    presentacionAux.saveAndClose();

    // ...y volver a abrirla antes de la siguiente iteración, actualizando diapos[]
    presentacionAux = SlidesApp.openById(idPresentacionAux);
    diapos = presentacionAux.getSlides();

    return blobImg;
    
  })

  // Eliminamos presentación auxiliar, ya tenemos los blobs/png
  archivoAux.setTrashed(true);
  
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

  // Tiempo final
  console.info(new Date() - t1);

  // Mensaje final
  SlidesApp.getUi().alert('✔️️ URL carpeta exportación:\n\n' + carpetaExp.getUrl());
}