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


  constructor(

    private cdr: ChangeDetectorRef

  ) {}


  ngOnInit() {

    this.cargarImagenes();

  }


  async cargarImagenes() {


    this.cargando = true;

    this.error = '';


    /*
      Actualizamos inmediatamente la interfaz
      para mostrar "Cargando imágenes..."
    */

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


      /*
        Forzamos a Angular a actualizar
        la pantalla después de terminar
        la petición a la API.
      */

      this.cdr.detectChanges();

    }

  }


  crearCartas() {


    const cartasTemporales: Carta[] = [];


    this.imagenes.forEach(

      (imagen, indice) => {


        /*
          Primera carta de la pareja
        */

        cartasTemporales.push({

          id: indice * 2,

          parejaId: indice,

          imagen: imagen,

          descubierta: false,

          encontrada: false

        });


        /*
          Segunda carta de la pareja
        */

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


  voltearCarta(

    carta: Carta

  ) {


    /*
      Bloquear clics mientras se
      comparan dos cartas.
    */

    if (this.bloqueado) {

      return;

    }


    /*
      No tocar cartas que ya
      fueron encontradas.
    */

    if (carta.encontrada) {

      return;

    }


    /*
      No seleccionar nuevamente
      una carta descubierta.
    */

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


      setTimeout(() => {


        this.reiniciarSeleccion();


        /*
          Actualizamos estadísticas
          después de encontrar pareja.
        */

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


        /*
          Actualizamos las cartas
          después de volverlas a ocultar.
        */

        this.cdr.detectChanges();


      }, 1000);

    }

  }


  reiniciarSeleccion() {


    this.primeraCarta = null;

    this.segundaCarta = null;


    this.bloqueado = false;

  }


  async nuevoJuego() {


    /*
      Bloqueamos temporalmente
      el tablero.
    */

    this.bloqueado = true;


    /*
      Reiniciamos las cartas
      seleccionadas.
    */

    this.primeraCarta = null;

    this.segundaCarta = null;


    /*
      Reiniciamos estadísticas.
    */

    this.movimientos = 0;

    this.parejasEncontradas = 0;


    /*
      Eliminamos las imágenes
      y cartas anteriores.
    */

    this.imagenes = [];

    this.cartas = [];


    /*
      Actualizamos la interfaz
      antes de pedir las nuevas imágenes.
    */

    this.cdr.detectChanges();


    /*
      Obtenemos 8 nuevas imágenes
      desde Dog CEO API.
    */

    await this.cargarImagenes();


    /*
      Habilitamos nuevamente
      el tablero.
    */

    this.bloqueado = false;


    /*
      Refrescamos la interfaz final.
    */

    this.cdr.detectChanges();

  }

}