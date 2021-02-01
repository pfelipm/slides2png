/**
 * Exporta todas las diapositivas de la presentación como imágenes
 * en una carpeta junto a la presentación.
 * Solo es una POC, ¡muy preliminar!
 * MIT License
 * Copyright (c) 2021 Pablo Felip Monferrer(@pfelipm)
 */

/* Crear menú del script */
function onOpen() {
 
  SlidesApp.getUi().createMenu('Slides2PNG')
    .addItem('📥 Exportar diapositivas como PNG', 'exportarDiaposPng')
    .addToUi();

}

/* Exporta todas las diapos como png en carpeta de Drive junto a la presentación */
function exportarDiaposPng() {

  // Copia auxiliar de la presentación, no parece ser posible actuar directamente
  // sobre la original por falta de actualización del orden de las diapositivas
  const presentacion = SlidesApp.getActivePresentation();
        archivoAux = DriveApp.getFileById(presentacion.getId()).makeCopy(),
        idPresentacionAux = archivoAux.getId()
        url = 'https://docs.google.com/presentation/d/'
              + idPresentacionAux
              + '/export/png?access_token='
              + ScriptApp.getOAuthToken();

  let presentacionAux = SlidesApp.openById(idPresentacionAux),
      diapos = presentacionAux.getSlides();
  
  // Obtener blobs (imágenes PNG) de cada diapositiva
  const blobs = diapos.map(diapo => {
    const blob = UrlFetchApp.fetch(url).getBlob();
    // Este truqui solo exporta la 1ª, así que las vamos moviendo al final 😎 
    diapos[0].move(diapos.length);
    // Ahora hay que cerrar la presentación para que el cambio de posición se efectúe...
    presentacionAux.saveAndClose();
    // ...y volver a abrirla antes de la siguiente iteración
    presentacionAux = SlidesApp.openById(idPresentacionAux);
    diapos = presentacionAux.getSlides();
    return blob;
  })

  // Eliminamos presentación auxiliar
  archivoAux.setTrashed(true);
  
  // Presentación en Drive
  const presentacionDrive = DriveApp.getFileById(presentacion.getId());

  // Nombre de la carpeta de exportación, se usa ID de presentación para identificarla
  const nombreCarpetaExp = `Miniaturas [${presentacionDrive.getId()}]`;

  // Carpeta que contiene a la presentación
  const carpeta  = presentacionDrive.getParents().next();

  // Si la carpeta de exportación ya existe la eliminamos para evitar duplicados
  if (carpeta.getFoldersByName(nombreCarpetaExp).hasNext()) {
    carpeta.getFoldersByName(nombreCarpetaExp).next().setTrashed(true);
  }

  // Crear carpeta de exportación
  const carpetaExp = carpeta.createFolder(nombreCarpetaExp);

  // Por fin, crear imágenes a partir de los blobs obtenidos para cada diapo,
  // nombres precedidos por nº de diapositiva con relleno de 0s por la izquierda
  const nDigitos = parseInt(blobs.length.toString().length);
  blobs.forEach((blob, n) => {
    carpetaExp.createFile(blob.setName(`Diapositiva ${String(n + 1).padStart(nDigitos, '0')}`));
  });

  // Mensaje final
  // SlidesApp.getUi().alert('✔️️ URL carpeta exportación:\n\n' + carpetaExp.getUrl());

}