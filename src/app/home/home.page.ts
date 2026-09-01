import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/angular';

import { Preferences } from '@capacitor/preferences';


interface Carta {

  id: number;

  parejaId: number;

  imagen: string;

  descubierta: boolean;

  encontrada: boolean;
}


@Component({

  selector: 'app-home',

  standalone: true,

  templateUrl: 'home.page.html',

  styleUrls: ['home.page.scss'],

  imports: [

    CommonModule,

    IonHeader,

    IonToolbar,

    IonTitle,

    IonContent

  ],

})


export class HomePage implements OnInit {


  imagenes: string[] = [];

  cartas: Carta[] = [];


  cargando = false;

  error = '';


  primeraCarta: Carta | null = null;

  segundaCarta: Carta | null = null;


  bloqueado = false;


  movimientos = 0;

  parejasEncontradas = 0;

  totalParejas = 8;


  /*
    Mejor resultado histórico.

    null significa que todavía
    no se ha completado ninguna partida.
  */

  mejorResultado: number | null = null;


  constructor(

    private cdr: ChangeDetectorRef

  ) {}


  async ngOnInit() {

    /*
      Primero recuperamos el récord
      guardado en el dispositivo.
    */

    await this.cargarMejorResultado();


    /*
      Después iniciamos el juego.
    */

    await this.cargarImagenes();

  }


  /*
    ==================================================
    PERSISTENCIA DEL MEJOR RESULTADO
    ==================================================
  */


  async cargarMejorResultado() {

    try {

      const resultado = await Preferences.get({

        key: 'mejorResultado'

      });


      if (resultado.value !== null) {

        this.mejorResultado =
          Number(resultado.value);

      }

    } catch (error) {

      console.error(

        'Error cargando mejor resultado:',

        error

      );

    }

  }


  async verificarMejorResultado() {

    /*
      Si nunca se ha guardado un récord,
      la primera partida terminada se
      convierte automáticamente en récord.
    */

    if (

      this.mejorResultado === null ||

      this.movimientos < this.mejorResultado

    ) {

      this.mejorResultado =
        this.movimientos;


      await Preferences.set({

        key: 'mejorResultado',

        value: this.movimientos.toString()

      });


      console.log(

        'Nuevo mejor resultado:',

        this.mejorResultado

      );

    }

  }


  /*
    ==================================================
    CARGA DE IMÁGENES
    ==================================================
  */


  async cargarImagenes() {


    this.cargando = true;

    this.error = '';


    this.cdr.detectChanges();


    try {


      const respuesta = await fetch(

        'https://dog.ceo/api/breeds/image/random/8'

      );


      if (!respuesta.ok) {

        throw new Error(

          'No fue posible consultar la API'

        );

      }


      const datos = await respuesta.json();


      if (datos.status !== 'success') {

        throw new Error(

          'La API respondió con un error'

        );

      }


      this.imagenes = datos.message;


      this.crearCartas();


    } catch (error) {


      console.error(

        'Error consultando Dog CEO API:',

        error

      );


      this.error =

        'No fue posible cargar las imágenes del juego.';


    } finally {


      this.cargando = false;


      this.cdr.detectChanges();

    }

  }


  /*
    ==================================================
    CREACIÓN DE CARTAS
    ==================================================
  */


  crearCartas() {


    const cartasTemporales: Carta[] = [];


    this.imagenes.forEach(

      (imagen, indice) => {


        cartasTemporales.push({

          id: indice * 2,

          parejaId: indice,

          imagen: imagen,

          descubierta: false,

          encontrada: false

        });


        cartasTemporales.push({

          id: indice * 2 + 1,

          parejaId: indice,

          imagen: imagen,

          descubierta: false,

          encontrada: false

        });


      }

    );


    this.cartas =

      this.barajarCartas(

        cartasTemporales

      );

  }


  /*
    ==================================================
    BARAJAR CARTAS
    ==================================================
  */


  barajarCartas(

    cartas: Carta[]

  ): Carta[] {


    const cartasBarajadas =

      [...cartas];


    /*
      Algoritmo Fisher-Yates
    */

    for (

      let i = cartasBarajadas.length - 1;

      i > 0;

      i--

    ) {


      const j =

        Math.floor(

          Math.random() * (i + 1)

        );


      [

        cartasBarajadas[i],

        cartasBarajadas[j]

      ] = [

        cartasBarajadas[j],

        cartasBarajadas[i]

      ];

    }


    return cartasBarajadas;

  }


  /*
    ==================================================
    VOLTEAR CARTAS
    ==================================================
  */


  voltearCarta(

    carta: Carta

  ) {


    if (this.bloqueado) {

      return;

    }


    if (carta.encontrada) {

      return;

    }


    if (carta.descubierta) {

      return;

    }


    carta.descubierta = true;


    /*
      Primera carta.
    */

    if (this.primeraCarta === null) {


      this.primeraCarta = carta;


      return;

    }


    /*
      Segunda carta.
    */

    this.segundaCarta = carta;


    this.movimientos++;


    this.compararCartas();

  }


  /*
    ==================================================
    COMPARAR CARTAS
    ==================================================
  */


  compararCartas() {


    if (

      this.primeraCarta === null ||

      this.segundaCarta === null

    ) {

      return;

    }


    this.bloqueado = true;


    const sonPareja =

      this.primeraCarta.parejaId ===

      this.segundaCarta.parejaId;


    if (sonPareja) {


      this.primeraCarta.encontrada = true;

      this.segundaCarta.encontrada = true;


      this.parejasEncontradas++;


      /*
        Cuando encontramos las 8 parejas,
        la partida ha terminado.
      */

      if (

        this.parejasEncontradas ===
        this.totalParejas

      ) {

        void this.verificarMejorResultado();

      }


      setTimeout(() => {


        this.reiniciarSeleccion();


        this.cdr.detectChanges();


      }, 400);


    } else {


      setTimeout(() => {


        if (this.primeraCarta) {

          this.primeraCarta.descubierta = false;

        }


        if (this.segundaCarta) {

          this.segundaCarta.descubierta = false;

        }


        this.reiniciarSeleccion();


        this.cdr.detectChanges();


      }, 1000);

    }

  }


  /*
    ==================================================
    REINICIAR SELECCIÓN
    ==================================================
  */


  reiniciarSeleccion() {


    this.primeraCarta = null;

    this.segundaCarta = null;


    this.bloqueado = false;

  }


  /*
    ==================================================
    NUEVO JUEGO
    ==================================================
  */


  async nuevoJuego() {


    this.bloqueado = true;


    this.primeraCarta = null;

    this.segundaCarta = null;


    /*
      Reiniciamos únicamente
      los datos de la partida actual.

      IMPORTANTE:
      mejorResultado NO se reinicia.
    */

    this.movimientos = 0;

    this.parejasEncontradas = 0;


    this.imagenes = [];

    this.cartas = [];


    this.cdr.detectChanges();


    await this.cargarImagenes();


    this.bloqueado = false;


    this.cdr.detectChanges();

  }

}