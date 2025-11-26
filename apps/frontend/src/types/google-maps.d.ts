/**
 * Google Maps Type Declarations
 * Minimal type definitions for Google Maps JavaScript API
 */

declare namespace google {
  namespace maps {
    class Map {
      constructor(element: HTMLElement, options?: MapOptions);
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      getBounds(): LatLngBounds | null | undefined;
      fitBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
      panTo(latLng: LatLng | LatLngLiteral): void;
      setOptions(options: MapOptions): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: MapTypeId | string;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
      styles?: MapTypeStyle[];
      gestureHandling?: string;
      [key: string]: any;
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain',
    }

    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers?: Array<{ [key: string]: any }>;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      contains(latLng: LatLng | LatLngLiteral): boolean;
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
      isEmpty(): boolean;
      toJSON(): LatLngBoundsLiteral;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setPosition(latLng: LatLng | LatLngLiteral): void;
      setMap(map: Map | null): void;
      setTitle(title: string): void;
      setIcon(icon: string | Icon | Symbol): void;
      getPosition(): LatLng | null | undefined;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
      label?: string | MarkerLabel;
      animation?: Animation;
      clickable?: boolean;
      draggable?: boolean;
      [key: string]: any;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      anchor?: Point;
      [key: string]: any;
    }

    interface Symbol {
      path: string | SymbolPath;
      fillColor?: string;
      fillOpacity?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      [key: string]: any;
    }

    enum SymbolPath {
      CIRCLE = 'circle',
      FORWARD_CLOSED_ARROW = 'forward_closed_arrow',
      FORWARD_OPEN_ARROW = 'forward_open_arrow',
      BACKWARD_CLOSED_ARROW = 'backward_closed_arrow',
      BACKWARD_OPEN_ARROW = 'backward_open_arrow',
    }

    enum Animation {
      BOUNCE = 'bounce',
      DROP = 'drop',
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    class InfoWindow {
      constructor(options?: InfoWindowOptions);
      open(map?: Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string | Node): void;
      setPosition(latLng: LatLng | LatLngLiteral): void;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
      maxWidth?: number;
      [key: string]: any;
    }

    interface MapsEventListener {
      remove(): void;
    }

    namespace event {
      function addListener(
        instance: any,
        eventName: string,
        handler: Function
      ): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
      function clearInstanceListeners(instance: any): void;
    }

    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(
          from: LatLng | LatLngLiteral,
          to: LatLng | LatLngLiteral,
          radius?: number
        ): number;
      }
    }

    class Data {
      constructor(options?: Data.DataOptions);
      add(feature: Data.Feature | Data.FeatureOptions): Data.Feature;
      addGeoJson(geoJson: any, options?: Data.GeoJsonOptions): Data.Feature[];
      forEach(callback: (feature: Data.Feature) => void): void;
      loadGeoJson(url: string, options?: Data.GeoJsonOptions, callback?: (features: Data.Feature[]) => void): void;
      remove(feature: Data.Feature): void;
      setMap(map: Map | null): void;
      setStyle(style: Data.StylingFunction | Data.StyleOptions): void;
      toGeoJson(callback: (json: any) => void): void;
    }

    namespace Data {
      interface DataOptions {
        map?: Map;
        style?: StylingFunction | StyleOptions;
      }

      class Feature {
        constructor(options?: FeatureOptions);
        forEachProperty(callback: (value: any, name: string) => void): void;
        getGeometry(): Geometry | null;
        getId(): number | string | undefined;
        getProperty(name: string): any;
        removeProperty(name: string): void;
        setGeometry(newGeometry: Geometry | LatLng | LatLngLiteral): void;
        setProperty(name: string, value: any): void;
        toGeoJson(callback: (json: any) => void): void;
      }

      interface FeatureOptions {
        geometry?: Geometry | LatLng | LatLngLiteral;
        id?: number | string;
        properties?: Record<string, any>;
      }

      interface StyleOptions {
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        icon?: string | Icon | Symbol;
        visible?: boolean;
        zIndex?: number;
        clickable?: boolean;
        draggable?: boolean;
        title?: string;
        label?: string | MarkerLabel;
      }

      type StylingFunction = (feature: Feature) => StyleOptions;

      interface GeoJsonOptions {
        idPropertyName?: string;
      }

      class Geometry {
        getType(): string;
        forEachLatLng(callback: (latLng: LatLng) => void): void;
      }
    }
  }
}
