import React from "react";
import { Composition } from "remotion";
import { Whiteboard } from "./Whiteboard";
import { AiRace } from "./airace/AiRace";
import { MarkerExplainer } from "./marker/MarkerExplainer";
import { UkraineWar } from "./ukraine/UkraineWar";
import { StoryDemo } from "./story/Story";
import { StoryVideo } from "./story/StoryVideo";
import { CartoonExplainer, type CartoonBeat } from "./cartoon/CartoonExplainer";
import { ThreeScene } from "./three/ThreeScene";
import { Thumbnail } from "./cartoon/Thumbnail";
import { ThumbnailV } from "./cartoon/ThumbnailV";
import { SpeedThumbnailV } from "./cartoon/SpeedThumbnailV";
import { IndiaBorders } from "./india/IndiaBorders";
import { KashmirExplainer } from "./kashmir/KashmirExplainer";
import { KashmirThumbnailV } from "./kashmir/KashmirThumbnailV";
import { WondersExplainer } from "./wonders/WondersExplainer";
import { WondersThumbnailV } from "./wonders/WondersThumbnailV";
import { WarMap } from "./warmap/WarMap";
import { WarMapThumbnailV } from "./warmap/WarMapThumbnailV";
import { KoreaWar } from "./korea/KoreaWar";
import { KoreaThumbnailV } from "./korea/KoreaThumbnailV";
import { KoreaLong } from "./korea/KoreaLong";
import { KoreaThumbnail16 } from "./korea/KoreaThumbnail16";
import { IranIraqWar, CTA_T as IRAQ_CTA_T, END_PAD as IRAQ_END_PAD } from "./iraniraq/IranIraqWar";
import { IranIraqThumbnailV } from "./iraniraq/IranIraqThumbnailV";
import { IraqLong, IraqShort } from "./iraniraq/IraqDoc";
import { IraqLongThumb, IraqShortThumb } from "./iraniraq/IraqThumbs";
import { GlobeTalesBanner, GlobeTalesLogo } from "./brand/GlobeTales";
import { WalkWorld, WalkWorldThumb } from "./daily/WalkWorld";
import { DarienGapThumb, DarienGapVideo } from "./daily/DarienGap";
import { SpainBordersThumb, SpainBordersVideo } from "./daily/SpainBorders";
import { PopulationDistributionThumb, PopulationDistributionVideo } from "./daily/PopulationDistribution";
import { DiomedeThumb, DiomedeVideo } from "./daily/DiomedeIslands";
import { TibetFlightsThumb, TibetFlightsVideo } from "./daily/TibetFlights";
import { IndiaThumbnailV } from "./india/IndiaThumbnailV";
import timingJson from "../public/timing.json";
import beatsJson from "../public/beats.json";
import configJson from "../config.json";
import type { Theme, Timing } from "./types";

const timing = timingJson as unknown as Timing;
const config = configJson as unknown as {
  fps: number;
  width: number;
  height: number;
  theme: Theme;
};

export const RemotionRoot: React.FC = () => {
  const durationInFrames = Math.max(
    1,
    Math.ceil((timing.durationSec + 0.6) * config.fps)
  );

  return (
    <>
      <Composition
        id="Whiteboard"
        component={Whiteboard}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing, theme: config.theme }}
      />
      <Composition
        id="AiRace"
        component={AiRace}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Marker"
        component={MarkerExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Ukraine"
        component={UkraineWar}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Story"
        component={StoryDemo}
        durationInFrames={7 * config.fps}
        fps={config.fps}
        width={config.width}
        height={config.height}
      />
      <Composition
        id="StoryVideo"
        component={StoryVideo}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Cartoon"
        component={CartoonExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing, beats: beatsJson as unknown as CartoonBeat[] }}
      />
      <Composition
        id="IndiaBorders"
        component={IndiaBorders}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Kashmir"
        component={KashmirExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="Wonders"
        component={WondersExplainer}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="WarMap"
        component={WarMap}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreaWar"
        component={KoreaWar}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={config.width}
        height={config.height}
        defaultProps={{ timing }}
      />
      <Composition
        id="IraqShort"
        component={IraqShort}
        durationInFrames={durationInFrames + 3 * config.fps}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="IraqLong"
        component={IraqLong}
        durationInFrames={durationInFrames + 3 * config.fps}
        fps={config.fps}
        width={1920}
        height={1080}
        defaultProps={{ timing }}
      />
      <Composition id="WalkWorld" component={WalkWorld} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WalkWorldThumb" component={WalkWorldThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapShort" component={DarienGapVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapLong" component={DarienGapVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DarienGapShortThumb" component={DarienGapThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapLongThumb" component={DarienGapThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="SpainBordersShort" component={SpainBordersVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersLong" component={SpainBordersVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="SpainBordersShortThumb" component={SpainBordersThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersLongThumb" component={SpainBordersThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionShort" component={PopulationDistributionVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionLong" component={PopulationDistributionVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionShortThumb" component={PopulationDistributionThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionLongThumb" component={PopulationDistributionThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DiomedeShort" component={DiomedeVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeLong" component={DiomedeVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DiomedeShortThumb" component={DiomedeThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeLongThumb" component={DiomedeThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TibetFlightsShort" component={TibetFlightsVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsLong" component={TibetFlightsVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TibetFlightsShortThumb" component={TibetFlightsThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsLongThumb" component={TibetFlightsThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="GlobeTalesLogo" component={GlobeTalesLogo} durationInFrames={1} fps={config.fps} width={800} height={800} />
      <Composition id="GlobeTalesBanner" component={GlobeTalesBanner} durationInFrames={1} fps={config.fps} width={2560} height={1440} />
      <Composition id="IraqShortThumb" component={IraqShortThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="IraqLongThumb" component={IraqLongThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition
        id="IranIraq"
        component={IranIraqWar}
        durationInFrames={Math.ceil((IRAQ_CTA_T + IRAQ_END_PAD) * config.fps)}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreaLong"
        component={KoreaLong}
        durationInFrames={durationInFrames}
        fps={config.fps}
        width={1920}
        height={1080}
        defaultProps={{ timing }}
      />
      <Composition
        id="Three"
        component={ThreeScene}
        durationInFrames={6 * config.fps}
        fps={config.fps}
        width={config.width}
        height={config.height}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={config.fps}
        width={1280}
        height={720}
      />
      <Composition
        id="ThumbnailV"
        component={ThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="IndiaThumbnailV"
        component={IndiaThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="SpeedThumbnailV"
        component={SpeedThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="KashmirThumbnailV"
        component={KashmirThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="WondersThumbnailV"
        component={WondersThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="WarMapThumbnailV"
        component={WarMapThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreaThumbnailV"
        component={KoreaThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="IranIraqThumbnailV"
        component={IranIraqThumbnailV}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
      />
      <Composition
        id="KoreaThumbnail16"
        component={KoreaThumbnail16}
        durationInFrames={1}
        fps={config.fps}
        width={1920}
        height={1080}
        defaultProps={{ timing }}
      />
    </>
  );
};
