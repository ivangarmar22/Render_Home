import * as THREE from 'three';
import { W, D, GZ, BZ1 } from './config.js';

// v: 0 oculta, 1 plano, 2 construida.
export const V = o => ({ sot: 0, baja: 0, pri: 0, cub: 0, ...o });

// Paradas del recorrido: p (cámara) y t (objetivo) son relativas a la planta b.
export const KEYS = [
  { id: 'hero', hold: 0.6, go: 1.6, fov: 35, v: V({ baja: 1 }) },
  { hold: 0.9, go: 1.5, b: 'baja', p: [50, 44, 50], t: [14, 0, -4], fov: 38, v: V({ baja: 2, pri: 2, cub: 2 }),
    card: { kick: 'asianPark 25 · Churriana, Málaga', title: 'La urbanización', meta: '25 viviendas · 2 hileras · piscina comunitaria',
      text: 'Dos hileras de chalets adosados se miran a través de una calle peatonal privada con pérgola y parterres. El recinto se cierra con murete y valla. A pie se entra por la calle India; en coche, por la calle Laos, con una rampa que baja al garaje. La vivienda 10 está en la hilera sur, con el jardín al sur.' } },
  { hold: 0.8, go: 1.4, b: 'baja', p: [-12.5, 9.5, -5.5], t: [-23.5, 0, -16.5], fov: 50,
    card: { kick: 'Zonas comunes', title: 'Piscina comunitaria', meta: 'Vaso de 6,95 × 4,44 m · aseos y zona de estar',
      text: 'En la esquina noroeste: piscina con escalera de obra y playa de piedra, hamacas, palmeras y setos. Al lado, el pabellón de aseos con una pérgola para sentarse, la escalera de evacuación del garaje y la salida a la avenida de China.' } },
  { hold: 0.8, go: 1.2, b: 'baja', p: [W / 2 + 1.5, 13, D + 11], t: [W / 2, 0, 4.5], fov: 45, v: V({ baja: 2 }),
    card: { kick: 'Planta baja', title: 'Planta baja', meta: '51,00 m² útiles · 5,54 × 9,48 m interiores',
      text: 'La planta se ordena en tres franjas. Hacia la calle peatonal, el aseo (3,03 m²), un recibidor de 1,30 m de paso y el despacho (8,05 m²). En el centro, la cocina y la escalera en U. Al fondo, 35,26 m² de salón-comedor-cocina diáfano que se abre a la terraza por una cristalera de 3,60 m.' } },
  { hold: 0.8, go: 1.1, b: 'baja', p: [2.55, 1.6, -5.0], t: [2.55, 1.3, 2.5], fov: 55,
    card: { no: 1, kick: 'Planta baja', title: 'Recibidor', meta: '1,30 × 1,67 m · puerta blindada de 0,97 m',
      text: 'Un vestíbulo de 1,30 m de ancho y 1,67 m de fondo reparte la planta. A la izquierda está el aseo, a la derecha el despacho y al frente la cocina abierta, con la escalera al fondo. La puerta de entrada es blindada, en antracita.' } },
  { hold: 0.8, go: 1.1, b: 'baja', p: [3.0, 1.65, 1.5], t: [0.7, 0.95, 4.3], fov: 62,
    card: { no: 2, kick: 'Planta baja', title: 'Cocina', meta: 'Frente de 3,33 m en L · isla de 0,45 × 1,80 m',
      text: 'Ocupa la franja izquierda, entre el aseo y el salón. El frente de 3,33 m tiene fregadero, placa y columna de horno, y gira en una L de 0,97 m que termina en un frigorífico americano. La isla de 45 cm es toda de almacenaje y deja 1,15 m de paso libre.' } },
  { hold: 0.8, go: 1.1, b: 'baja', p: [1.3, 1.7, 9.25], t: [4.6, 0.9, 7.2], fov: 62,
    card: { no: 3, kick: 'Planta baja', title: 'Salón y comedor', meta: '35,26 m² con la cocina · 5,54 × 3,56 m',
      text: 'La zona de estar ocupa todo el ancho de la casa, 5,54 m, con 3,56 m de fondo hasta la cristalera de 3,60 m que da a la terraza. A la derecha, un sofá en L mira a la TV de la medianera, colgada sobre un mueble de roble de 2 m. A la izquierda, la mesa de comedor para seis bajo dos lámparas colgantes.' } },
  { hold: 0.8, go: 1.2, b: 'baja', p: [1.0, 2.2, GZ + 6.7], t: [3.2, 0.9, GZ + 0.4], fov: 55,
    card: { no: 4, kick: 'Exterior privado', title: 'Terraza y jardín', meta: 'Terraza 17,20 m² · jardín 22,94 m²',
      text: 'Detrás del salón hay una terraza de 5,62 × 3,00 m con suelo cerámico antideslizante y mesa para seis. Le sigue un jardín de césped de 5,62 × 4,05 m, cerrado al fondo por un seto y a los lados por tapias bajas con los vecinos. En total, más de 40 m² al aire libre orientados al sur.' } },
  { hold: 0.8, go: 1.1, b: 'baja', p: [4.75, 1.7, 3.35], t: [3.55, 0.95, 1.0], fov: 62,
    card: { no: 5, kick: 'Planta baja', title: 'Despacho', meta: '8,05 m² · 2,18 × 3,67 m',
      text: 'Una habitación de 2,18 × 3,67 m con una ventana de 1,40 m a la calle peatonal. Junto a la puerta, una mesa de 2 m con la torre y tres monitores curvos. Enfrente, contra la medianera, un armario de 1,50 m con puertas correderas. El centro queda libre.' } },
  { hold: 0.8, go: 1.3, b: 'baja', p: [1.05, 5.0, 1.75], t: [0.93, 0, 0.78], fov: 50,
    card: { no: 6, kick: 'Planta baja', title: 'Aseo', meta: '3,03 m² · 1,86 × 1,59 m',
      text: 'Pequeño pero completo. En 1,86 × 1,59 m caben el inodoro, un plato de ducha de 0,82 × 0,67 m en la esquina con mampara de vidrio y un lavabo de 60 cm. Tiene ventana de 0,60 m a la calle y alicatado cerámico.' } },
  { hold: 0.9, go: 1.2, b: 'baja', p: [W / 2 + 1.5, 14.5, D + 10], t: [W / 2, 2.9, 4.8], fov: 45, v: V({ baja: 2, pri: 2 }),
    card: { kick: 'Planta primera', title: 'Planta primera', meta: '50,52 m² útiles · zona de noche',
      text: 'La escalera en U de mármol, con tramos de 0,90 m, llega a un pasillo de 2,50 m² que reparte la planta. Hacia la calle hay dos dormitorios de 10,85 y 9,29 m², con el baño 2 en el centro. Hacia el jardín está la suite principal de 14,95 m², con vestidor y baño propios.' } },
  { hold: 0.8, go: 1.0, b: 'pri', p: [2.65, 1.75, 6.35], t: [4.6, 0.4, 7.9], fov: 62,
    card: { no: 7, kick: 'Planta primera', title: 'Dormitorio principal', meta: '14,95 m² · 3,15 × 3,63 m + vestidor y baño',
      text: 'Ocupa la esquina del jardín: 3,15 m de ancho por 3,63 m de fondo, con una ventana de 1,80 m entre cortinas. La cama de 1,60 m se apoya en la medianera y deja paso a los dos lados. Se entra por un hueco sin puerta. Con el vestidor y el baño, la suite pasa de 23 m².' } },
  { hold: 0.8, go: 1.1, b: 'pri', p: [2.75, 1.6, 6.62], t: [0, 1.05, 6.62], fov: 66,
    card: { no: 8, kick: 'Planta primera', title: 'Vestidor', meta: '3,80 m² · 2,36 × 1,61 m',
      text: 'Un paso de 2,36 × 1,61 m junto al baño de la suite. A cada lado hay armarios abiertos con baldas y barra, y al fondo un espejo de cuerpo entero. En la esquina queda el pilar de obra que sube desde la cocina.' } },
  { hold: 0.8, go: 1.1, b: 'pri', p: [2.0, 4.5, 6.9], t: [1.18, 0, 8.55], fov: 50,
    card: { no: 9, kick: 'Planta primera', title: 'Baño 1', meta: '4,41 m² · 2,26 × 1,93 m',
      text: 'El baño de la suite mide 2,26 × 1,93 m. A un lado, un plato de ducha de 0,74 × 1,94 m que ocupa todo el fondo, con mampara fija. En el centro, un mueble con doble lavabo, y junto a la ventana al jardín, el inodoro.' } },
  { hold: 0.8, go: 1.1, b: 'pri', p: [2.85, 1.8, 2.75], t: [4.6, 0.4, 1.4], fov: 62,
    card: { no: 10, kick: 'Planta primera', title: 'Dormitorio 2', meta: '10,85 m² · 3,15 × 2,98 m',
      text: 'Da a la calle peatonal: 3,15 × 2,98 m con una ventana de 1,40 m y persiana. La cama de 1,20 m se apoya en la medianera, con una mesilla a cada lado. Enfrente hay un armario empotrado de 2,16 m con puertas correderas.' } },
  { hold: 0.8, go: 1.1, b: 'pri', p: [2.15, 1.8, 3.0], t: [0.6, 0.5, 1.2], fov: 62,
    card: { no: 11, kick: 'Planta primera', title: 'Dormitorio 3', meta: '9,29 m² · 2,36 × 3,30 m',
      text: 'Es el más pequeño, 2,36 × 3,30 m, y también da a la calle. La cama de 1,20 m está pegada a la ventana de 1,40 m, con una mesilla. El armario empotrado aprovecha el hueco de 0,65 m junto al pasillo.' } },
  { hold: 0.8, go: 1.4, b: 'pri', p: [2.3, 4.3, 3.4], t: [1.18, 0, 4.85], fov: 50,
    card: { no: 12, kick: 'Planta primera', title: 'Baño 2', meta: '3,87 m² · 2,30 × 1,65 m',
      text: 'Está entre los dos dormitorios pequeños, que lo comparten desde el pasillo. En 2,30 × 1,65 m hay una bañera de 1,52 m con mampara, inodoro y lavabo sobre mueble, todo con alicatado cerámico.' } },
  { hold: 0.9, go: 1.3, b: 'cub', p: [W + 6, 7, D + 8], t: [W / 2, 0, 4.2], fov: 45, v: V({ baja: 2, pri: 2, cub: 2 }),
    card: { kick: 'Solárium', title: 'Planta solárium', meta: '45,58 m² · 5,54 × 11,36 m con los vuelos',
      text: 'La cubierta es transitable de punta a punta: 5,54 m de ancho por 11,36 m de fondo. El casetón de la escalera, de 2,57 m, la divide en dos mitades de 4,40 m. Hacia la calle hay un porche cerrado y hacia el jardín, la zona de servicio al aire libre.' } },
  { hold: 0.8, go: 1.1, b: 'cub', p: [4.9, 1.65, 2.55], t: [1.0, 0.7, 0.3], fov: 62,
    card: { no: 13, kick: 'Solárium', title: 'Porche bioclimático', meta: '5,54 × 4,40 m · lamas orientables y cristal',
      text: 'La mitad que da a la calle se cubre con una pérgola de lamas orientables y se cierra con cortinas de cristal Lumon. Dentro hay dos sofás en L en la esquina y una mesa de terraza de 2 m con ocho sillas. Contra el casetón, un armario de 2,80 m guarda el material de gimnasio.' } },
  { hold: 0.8, go: 1.6, b: 'cub', p: [0.3, 4.3, D + 2.2], t: [3.3, 0.2, 6.6], fov: 58,
    card: { no: 14, kick: 'Solárium', title: 'Solárium', meta: '5,54 × 4,40 m al aire libre',
      text: 'La mitad del jardín queda descubierta, con suelo cerámico y barandilla de vidrio. Contra el casetón hay una encimera con fregadero y la barbacoa. En la medianera, un armario para la lavadora y dos máquinas de aire. En el centro queda el tendedero y, a la salida de la escalera, el pilar de obra del plano.' } },
  { hold: 0.9, go: 1.2, b: 'sot', p: [W + 5.5, 9, BZ1 + 4.5], t: [W / 2, 0, 4.4], fov: 45, v: V({ sot: 2 }),
    card: { kick: 'Bajo rasante', title: 'Planta sótano', meta: '2 plazas de garaje · 31,69 m² de sótano',
      text: 'La planta ocupa todo el solar bajo la casa y avanza 1,40 m bajo la calle. Delante está el garaje de dos plazas, de 14,47 y 14,50 m², que da a la calle de garaje. Detrás de un vestíbulo de 1,95 m² quedan 31,69 m² de sótano, acabados aquí como estudio, zona de juegos y trastero.' } },
  { hold: 0.8, go: 1.1, b: 'sot', p: [W / 2, 4.6, -6.6], t: [W / 2, 0.2, 1.6], fov: 52,
    card: { no: 15, kick: 'Bajo rasante', title: 'Garaje', meta: '2 plazas · 14,47 y 14,50 m²',
      text: 'Dos plazas de 2,80 × 5,17 y 2,93 × 4,95 m con acceso directo a la vivienda. Aparcan un BMW X3 blanco y un Ford Mondeo champán, con una trail negra en medio. Al fondo, un vestíbulo de 1,95 m² separa el garaje del sótano.' } },
  { hold: 0.8, go: 1.1, b: 'sot', p: [2.7, 6.4, 10.0], t: [2.7, 0, 6.8], fov: 52,
    card: { no: 16, kick: 'Bajo rasante', title: 'Estudio y juegos', meta: '5,54 m de ancho · unos 20 m²',
      text: 'Entre la escalera y el trastero queda una sala de 5,54 m de ancho. En una medianera hay dos escritorios con portátil, monitor y silla gaming. Enfrente, un sofá grande con la TV y las consolas. Un panel de listones verticales de roble oculta la aerotermia.' } },
  { hold: 0.8, go: 1.6, b: 'sot', p: [2.8, 5.2, 7.0], t: [2.8, 0, 9.6], fov: 50,
    card: { no: 17, kick: 'Bajo rasante', title: 'Trastero', meta: '7,81 m² · 5,54 × 1,41 m',
      text: 'Una franja de 5,54 × 1,41 m al fondo del sótano, bajo la terraza, cerrada con tabique. Tiene estanterías a lo largo de la pared para cajas, maletas y ropa de temporada.' } },
  { id: 'end', hold: 1.2, go: 0, b: 'baja', p: [W / 2 + 16, 20, D + 26], t: [W / 2 + 2, 2, 3], fov: 42, v: V({ baja: 2, pri: 2, cub: 2 }) },
];

// Convierte las posiciones relativas a coordenadas absolutas.
export function resolveKeys(LV) {
  KEYS.forEach((k, i) => {
    if (!k.v) k.v = KEYS[i - 1].v;
    k.P = new THREE.Vector3();
    k.Tg = new THREE.Vector3();
    if (k.p) {
      const y = LV[k.b].y;
      k.P.set(k.p[0], k.p[1] + y, k.p[2]);
      k.Tg.set(k.t[0], k.t[1] + y, k.t[2]);
    }
  });
}
