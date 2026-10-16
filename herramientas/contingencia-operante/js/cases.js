/*
 * Banco de casos. Todos son ficticios.
 *   a = hizo R y hubo C      b = hizo R y no hubo C
 *   c = no hizo R y hubo C   d = no hizo R y no hubo C
 * efecto: qué le pasó a la conducta R con el tiempo ('aumenta' | 'disminuye' | 'igual').
 * El tipo de procedimiento no se guarda: se calcula con logic.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CasosContingencia = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return [
    {
      id: 'cinturon',
      titulo: 'El cinturón de Pedro',
      texto: 'El auto nuevo de Pedro emite un pitido agudo y molesto al arrancar si el cinturón no está puesto. Con las semanas, Pedro se abrocha el cinturón cada vez con más frecuencia.',
      R: 'abrocharse el cinturón antes de arrancar',
      C: 'que suene el pitido',
      unidad: 'arranques del auto',
      a: 0, b: 10, c: 10, d: 0,
      efecto: 'aumenta',
      nota: 'El pitido es aversivo, pero «negativo» no quiere decir que algo «se quite»: quiere decir que abrocharse el cinturón baja la probabilidad de que suene.'
    },
    {
      id: 'ruleta',
      titulo: 'La ruleta de Marta',
      texto: 'Marta anota durante 30 noches si ganó dinero y si apostó a la ruleta o no. Con el tiempo, apuesta cada vez más seguido.',
      R: 'apostar a la ruleta',
      C: 'ganar dinero',
      unidad: 'noches',
      a: 6, b: 14, c: 0, d: 10,
      efecto: 'aumenta',
      nota: 'Aunque la mayoría de las noches en que apuesta no gana, apostar sigue haciendo más probable ganar que no apostar.'
    },
    {
      id: 'estufa',
      titulo: 'La estufa de Tomás',
      texto: 'Tomás, de dos años, a veces toca la estufa encendida. Se registraron 20 visitas a la cocina. Con las semanas, la toca cada vez menos.',
      R: 'tocar la estufa encendida',
      C: 'quemarse',
      unidad: 'visitas a la cocina',
      a: 8, b: 2, c: 0, d: 10,
      efecto: 'disminuye',
      nota: '«Positivo» no significa «bueno»: significa que la conducta aumenta la probabilidad de la consecuencia. Acá la conducta baja, por eso es castigo.'
    },
    {
      id: 'celular',
      titulo: 'El celular de Valentina',
      texto: 'Los padres de Valentina le dejan usar el celular a la tarde, salvo que se haya portado mal con su hermana. Con las semanas, se porta mal con su hermana cada vez menos.',
      R: 'portarse mal con su hermana',
      C: 'usar el celular esa tarde',
      unidad: 'tardes',
      a: 2, b: 8, c: 9, d: 1,
      efecto: 'disminuye',
      nota: 'El celular es algo apetitivo, pero acá no importa eso: portarse mal baja la probabilidad de usarlo (contingencia negativa) y la conducta disminuye.'
    },
    {
      id: 'remera',
      titulo: 'La remera de la suerte',
      texto: 'Lucía cree que aprueba más cuando se pone su remera verde. Anotó el resultado de 14 parciales, con y sin remera. Su costumbre de usarla no cambió.',
      R: 'ponerse la remera verde',
      C: 'aprobar el parcial',
      unidad: 'parciales',
      a: 3, b: 3, c: 4, d: 4,
      efecto: 'igual',
      nota: 'Aprobó la mitad de las veces con remera y la mitad de las veces sin remera: la probabilidad es la misma, así que no hay contingencia.'
    },
    {
      id: 'mano',
      titulo: 'Levantar la mano',
      texto: 'Nicolás registra durante 22 clases si levantó la mano y si la docente le dio la palabra. Con el cuatrimestre, levanta la mano cada vez más seguido.',
      R: 'levantar la mano',
      C: 'que la docente le dé la palabra',
      unidad: 'clases',
      a: 9, b: 3, c: 1, d: 9,
      efecto: 'aumenta',
      nota: 'Fijate que las cantidades de clases con y sin mano levantada son distintas (12 y 10): por eso se comparan probabilidades y no frecuencias absolutas.'
    },
    {
      id: 'pastilla',
      titulo: 'La pastilla para el dolor',
      texto: 'Julia anotó 20 dolores de cabeza: en 8 tomó una pastilla de la marca X y en 12 no. Con el tiempo, toma la pastilla cada vez más seguido.',
      R: 'tomar la pastilla',
      C: 'que el dolor de cabeza siga',
      unidad: 'dolores de cabeza',
      a: 2, b: 6, c: 9, d: 3,
      efecto: 'aumenta',
      nota: 'Tomar la pastilla baja la probabilidad de que el dolor siga (contingencia negativa) y la conducta aumenta: reforzamiento negativo.'
    },
    {
      id: 'tarde',
      titulo: 'Llegar tarde al trabajo',
      texto: 'Se registraron 30 días de Federico en la oficina. Con los meses, llega tarde cada vez menos.',
      R: 'llegar tarde al trabajo',
      C: 'recibir un llamado de atención',
      unidad: 'días',
      a: 8, b: 2, c: 1, d: 19,
      efecto: 'disminuye',
      nota: 'Llegar tarde aumenta la probabilidad del llamado de atención (contingencia positiva) y la conducta baja: castigo positivo.'
    },
    {
      id: 'musica',
      titulo: 'La música del viaje',
      texto: 'En los viajes en auto, el hermano mayor elige la música si los chicos se portaron bien. Con los viajes, Joaquín se pelea con su hermano cada vez menos.',
      R: 'pelearse con su hermano en el viaje',
      C: 'elegir la música del auto',
      unidad: 'viajes',
      a: 1, b: 9, c: 8, d: 2,
      efecto: 'disminuye',
      nota: 'Pelearse baja la probabilidad de elegir la música (contingencia negativa) y la conducta disminuye: castigo negativo.'
    },
    {
      id: 'berrinche',
      titulo: 'El berrinche en el supermercado',
      texto: 'Cada vez que Sofía hace un berrinche en el supermercado, los padres la retan. Cuando no lo hace, la mayoría de las veces nadie le presta atención. Con las salidas, hace berrinches cada vez más seguido.',
      R: 'hacer un berrinche',
      C: 'que los padres le presten atención (aunque sea para retarla)',
      unidad: 'salidas de compras',
      a: 9, b: 1, c: 3, d: 12,
      efecto: 'aumenta',
      nota: 'Un reto parece aversivo, pero la conducta aumenta: funciona como reforzador. Lo que define el procedimiento es el efecto sobre la conducta, no lo que «parece» agradable o desagradable.'
    }
  ];
});
