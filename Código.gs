/**
 * Exporta todas las diapositivas de la presentación con la url indicada en:
 * const URL_PRESENTACION= ''
 * como imágenes PNG en una carpeta junto a la presentación.
 *
 * ¡Muy preliminar!
 * 
 * MIT License
 * Copyright (c) 2021 Pablo Felip Monferrer(@pfelipm)
 */

const URL_PRESENTACION = 'https://docs.google.com/presentation/d/144pPxBeABfBo8V2OS9h2gfuKMFTDr8XLyKoHtOrxc60/edit';

/* Exporta todas las diapos como png en carpeta de Drive junto a la presentación */
function exportarDiaposPng() {

  let presentacion = SlidesApp.openByUrl(URL_PRESENTACION),
      diapos = presentacion.getSlides();

  const idPresentacion = presentacion.getId(),
        url = 'https://docs.google.com/presentation/d/'
              + idPresentacion
              + '/export/png?access_token='
              + ScriptApp.getOAuthToken();
  
  // Obtener blobs (imágenes PNG) de cada diapositiva
  const blobs = diapos.map(diapo => {
    const blob = UrlFetchApp.fetch(url).getBlob();
    // Este truqui solo exporta la 1ª, así que las vamos moviendo al final 😎 
    diapos[0].move(diapos.length);
    // Ahora hay que cerrar la presentación para que el cambio de posición se efectúe...
    presentacion.saveAndClose();
    // ...y volver a abrirla antes de la siguiente iteración >> por esta razón esto no puede realizarse con un .map()
    presentacion = SlidesApp.openById(idPresentacion);
    diapos = presentacion.getSlides();
    return blob;
  })

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

  // Por fin, creamos imágenes a partir de los blobs obtenidos para cada diapo,
  // nombres precedidos por nº de diapositiva con relleno de 0s por la izquierda
  const nDigitos = parseInt(blobs.length.toString().length);
  blobs.forEach((blob, n) => {
    carpetaExp.createFile(blob.setName(`Diapositiva ${String(n + 1).padStart(nDigitos, '0')}`));
  });

}