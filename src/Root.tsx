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
import { TinySlotEscape, TinySlotThumb } from "./daily/TinySlotEscape";
import { DarienGapThumb, DarienGapVideo } from "./daily/DarienGap";
import { SpainBordersThumb, SpainBordersVideo } from "./daily/SpainBorders";
import { PopulationDistributionThumb, PopulationDistributionVideo } from "./daily/PopulationDistribution";
import { DiomedeThumb, DiomedeVideo } from "./daily/DiomedeIslands";
import { TibetFlightsThumb, TibetFlightsVideo } from "./daily/TibetFlights";
import { TimeZonesThumb, TimeZonesVideo } from "./daily/TimeZones";
import { GreatPlainsShelterbeltThumb, GreatPlainsShelterbeltVideo } from "./daily/GreatPlainsShelterbelt";
import { JetStreamsThumb, JetStreamsVideo } from "./daily/JetStreams";
import { ChileGeographyThumb, ChileGeographyVideo } from "./daily/ChileGeography";
import { WallaceLineThumb, WallaceLineVideo } from "./daily/WallaceLine";
import { CountryClosestSpaceThumb, CountryClosestSpaceVideo } from "./daily/CountryClosestSpace";
import { MarketIslandThumb, MarketIslandVideo } from "./daily/MarketIsland";
import { coverLeadFrames, withCover } from "./cartoon/WithCover";
import { SatMapDemo } from "./geo/SatMapDemo";
import { BermudaThumb, BermudaTriangle } from "./daily/BermudaTriangle";
import { ChannelIntro, ChannelIntroThumb, INTRO_SECONDS } from "./daily/ChannelIntro";
import { ShahJahanThumb, ShahJahanWives, TAJ_SECONDS } from "./daily/ShahJahanWives";
import { PILOT_SECONDS, PilotHero, PilotThumb } from "./daily/PilotHero";
import {
  KoreanPeninsulaThumb,
  KoreanPeninsulaVideo,
} from "./daily/KoreanPeninsulaConflict";

const ChannelIntroIG = withCover(ChannelIntro, ChannelIntroThumb, { beat: 0.12 });
const ShahJahanWivesIG = withCover(ShahJahanWives, ShahJahanThumb);
const PilotHeroIG = withCover(PilotHero, PilotThumb);
const KoreanPeninsulaShortIG = withCover(
  KoreanPeninsulaVideo,
  KoreanPeninsulaThumb
);
import {
  StraitOfGibraltarThumb,
  StraitOfGibraltarVideo,
} from "./daily/StraitOfGibraltar";
import { DarienGapSatThumb, DarienGapSatVideo } from "./daily/DarienGapSat";
import { SpainBordersThumbSat, SpainBordersVideoSat } from "./daily/SpainBordersSat";
import {
  PopulationDistributionThumbSat,
  PopulationDistributionVideoSat,
} from "./daily/PopulationDistributionSat";
import { DiomedeThumbSat, DiomedeVideoSat } from "./daily/DiomedeIslandsSat";
import { TibetFlightsThumbSat, TibetFlightsVideoSat } from "./daily/TibetFlightsSat";
import { TimeZonesThumbSat, TimeZonesVideoSat } from "./daily/TimeZonesSat";
import {
  GreatPlainsShelterbeltThumbSat,
  GreatPlainsShelterbeltVideoSat,
} from "./daily/GreatPlainsShelterbeltSat";
import { JetStreamsThumbSat, JetStreamsVideoSat } from "./daily/JetStreamsSat";
import { ChileGeographyThumbSat, ChileGeographyVideoSat } from "./daily/ChileGeographySat";
import { WallaceLineThumbSat, WallaceLineVideoSat } from "./daily/WallaceLineSat";
import {
  CountryClosestSpaceThumbSat,
  CountryClosestSpaceVideoSat,
} from "./daily/CountryClosestSpaceSat";
import {
  MarketIslandThumbSat,
  MarketIslandVideoSat,
} from "./daily/MarketIslandSat";

const BermudaIG = withCover(BermudaTriangle, BermudaThumb);
const BermudaVoiceIG = withCover<{ timing: Timing }>((p) => <BermudaTriangle {...p} captions={false} />, BermudaThumb);
const StraitOfGibraltarIG = withCover(
  StraitOfGibraltarVideo,
  StraitOfGibraltarThumb
);
const DarienGapSatIG = withCover(DarienGapSatVideo, DarienGapSatThumb);
const SpainBordersIGSat = withCover(SpainBordersVideoSat, SpainBordersThumbSat);
const PopulationDistributionIGSat = withCover(
  PopulationDistributionVideoSat,
  PopulationDistributionThumbSat
);
const DiomedeIGSat = withCover(DiomedeVideoSat, DiomedeThumbSat);
const TibetIGSat = withCover(TibetFlightsVideoSat, TibetFlightsThumbSat);
const TimeZonesIGSat = withCover(TimeZonesVideoSat, TimeZonesThumbSat);
const ShelterbeltIGSat = withCover(
  GreatPlainsShelterbeltVideoSat,
  GreatPlainsShelterbeltThumbSat
);
const JetStreamsIGSat = withCover(JetStreamsVideoSat, JetStreamsThumbSat);
const ChileGeographyIGSat = withCover(ChileGeographyVideoSat, ChileGeographyThumbSat);
const WallaceLineIGSat = withCover(WallaceLineVideoSat, WallaceLineThumbSat);
const CountryClosestSpaceIGSat = withCover(
  CountryClosestSpaceVideoSat,
  CountryClosestSpaceThumbSat
);
const MarketIslandIGSat = withCover(MarketIslandVideoSat, MarketIslandThumbSat);

const TinySlotIG = withCover(TinySlotEscape, TinySlotThumb);
const WalkWorldIG = withCover(WalkWorld, WalkWorldThumb);
const DarienGapIG = withCover(DarienGapVideo, DarienGapThumb);
const SpainBordersIG = withCover(SpainBordersVideo, SpainBordersThumb);
const PopulationIG = withCover(PopulationDistributionVideo, PopulationDistributionThumb);
const DiomedeIG = withCover(DiomedeVideo, DiomedeThumb);
const TibetIG = withCover(TibetFlightsVideo, TibetFlightsThumb);
const TimeZonesIG = withCover(TimeZonesVideo, TimeZonesThumb);
const ShelterbeltIG = withCover(GreatPlainsShelterbeltVideo, GreatPlainsShelterbeltThumb);
const JetStreamsIG = withCover(JetStreamsVideo, JetStreamsThumb);
const ChileGeographyIG = withCover(ChileGeographyVideo, ChileGeographyThumb);
const WallaceLineIG = withCover(WallaceLineVideo, WallaceLineThumb);
const CountryClosestSpaceIG = withCover(CountryClosestSpaceVideo, CountryClosestSpaceThumb);
const MarketIslandIG = withCover(MarketIslandVideo, MarketIslandThumb);
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
      <Composition id="ChannelIntro" component={ChannelIntroIG} durationInFrames={Math.round(INTRO_SECONDS * config.fps) + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} />
      <Composition id="ChannelIntroThumb" component={ChannelIntroThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} />
      <Composition id="ShahJahanWives" component={ShahJahanWivesIG} durationInFrames={Math.round(TAJ_SECONDS * config.fps) + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} />
      <Composition id="ShahJahanWivesThumb" component={ShahJahanThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} />
      <Composition id="PilotHero" component={PilotHeroIG} durationInFrames={Math.round(PILOT_SECONDS * config.fps) + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} />
      <Composition id="PilotHeroThumb" component={PilotThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} />
      <Composition id="BermudaTriangleVoice" component={BermudaVoiceIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="BermudaTriangleShort" component={BermudaIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="BermudaTriangleThumb" component={BermudaThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="StraitOfGibraltarShort" component={StraitOfGibraltarIG} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="StraitOfGibraltarLong" component={StraitOfGibraltarVideo} durationInFrames={durationInFrames + 2 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="StraitOfGibraltarShortThumb" component={StraitOfGibraltarThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="StraitOfGibraltarLongThumb" component={StraitOfGibraltarThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="SatMapDemo" component={SatMapDemo} durationInFrames={180} fps={config.fps} width={1080} height={1920} />
      <Composition id="DarienGapSatShort" component={DarienGapSatIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapSatThumb" component={DarienGapSatThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersShortSat" component={SpainBordersIGSat} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersThumbSat" component={SpainBordersThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionShortSat" component={PopulationDistributionIGSat} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionThumbSat" component={PopulationDistributionThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeShortSat" component={DiomedeIGSat} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeThumbSat" component={DiomedeThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsShortSat" component={TibetIGSat} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsThumbSat" component={TibetFlightsThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TimeZonesShortSat" component={TimeZonesIGSat} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TimeZonesThumbSat" component={TimeZonesThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltShortSat" component={ShelterbeltIGSat} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltThumbSat" component={GreatPlainsShelterbeltThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="JetStreamsShortSat" component={JetStreamsIGSat} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="JetStreamsThumbSat" component={JetStreamsThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TinySlotEscape" component={TinySlotIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TinySlotThumb" component={TinySlotThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WalkWorld" component={WalkWorldIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WalkWorldThumb" component={WalkWorldThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapShort" component={DarienGapIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapLong" component={DarienGapVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DarienGapShortThumb" component={DarienGapThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DarienGapLongThumb" component={DarienGapThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="SpainBordersShort" component={SpainBordersIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersLong" component={SpainBordersVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="SpainBordersShortThumb" component={SpainBordersThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="SpainBordersLongThumb" component={SpainBordersThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionShort" component={PopulationIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionLong" component={PopulationDistributionVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionShortThumb" component={PopulationDistributionThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="PopulationDistributionLongThumb" component={PopulationDistributionThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DiomedeShort" component={DiomedeIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeLong" component={DiomedeVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="DiomedeShortThumb" component={DiomedeThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="DiomedeLongThumb" component={DiomedeThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TibetFlightsShort" component={TibetIG} durationInFrames={durationInFrames + 3 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsLong" component={TibetFlightsVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TibetFlightsShortThumb" component={TibetFlightsThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TibetFlightsLongThumb" component={TibetFlightsThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TimeZonesShort" component={TimeZonesIG} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TimeZonesLong" component={TimeZonesVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="TimeZonesShortThumb" component={TimeZonesThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="TimeZonesLongThumb" component={TimeZonesThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltShort" component={ShelterbeltIG} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltLong" component={GreatPlainsShelterbeltVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltShortThumb" component={GreatPlainsShelterbeltThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="GreatPlainsShelterbeltLongThumb" component={GreatPlainsShelterbeltThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="JetStreamsShort" component={JetStreamsIG} durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="JetStreamsLong" component={JetStreamsVideo} durationInFrames={durationInFrames + 3 * config.fps} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="JetStreamsShortThumb" component={JetStreamsThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="JetStreamsLongThumb" component={JetStreamsThumb} durationInFrames={1} fps={config.fps} width={1920} height={1080} defaultProps={{ timing }} />
      <Composition id="ChileGeographyShort" component={ChileGeographyIG} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="ChileGeographyShortThumb" component={ChileGeographyThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="ChileGeographyShortSat" component={ChileGeographyIGSat} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="ChileGeographyThumbSat" component={ChileGeographyThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WallaceLineShortSat" component={WallaceLineIGSat} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WallaceLineThumbSat" component={WallaceLineThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WallaceLineShort" component={WallaceLineIG} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="WallaceLineShortThumb" component={WallaceLineThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="CountryClosestSpaceShort" component={CountryClosestSpaceIG} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="CountryClosestSpaceShortThumb" component={CountryClosestSpaceThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="CountryClosestSpaceShortSat" component={CountryClosestSpaceIGSat} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="CountryClosestSpaceThumbSat" component={CountryClosestSpaceThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="MarketIslandShort" component={MarketIslandIG} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="MarketIslandShortThumb" component={MarketIslandThumb} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="MarketIslandShortSat" component={MarketIslandIGSat} durationInFrames={durationInFrames + config.fps + coverLeadFrames(config.fps)} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
      <Composition id="MarketIslandThumbSat" component={MarketIslandThumbSat} durationInFrames={1} fps={config.fps} width={1080} height={1920} defaultProps={{ timing }} />
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
      <Composition
        id="KoreanPeninsulaConflictShort"
        component={KoreanPeninsulaShortIG}
        durationInFrames={durationInFrames + 2 * config.fps + coverLeadFrames(config.fps)}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreanPeninsulaConflictLong"
        component={KoreanPeninsulaVideo}
        durationInFrames={durationInFrames + 2 * config.fps}
        fps={config.fps}
        width={1920}
        height={1080}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreanPeninsulaConflictShortThumb"
        component={KoreanPeninsulaThumb}
        durationInFrames={1}
        fps={config.fps}
        width={1080}
        height={1920}
        defaultProps={{ timing }}
      />
      <Composition
        id="KoreanPeninsulaConflictLongThumb"
        component={KoreanPeninsulaThumb}
        durationInFrames={1}
        fps={config.fps}
        width={1920}
        height={1080}
        defaultProps={{ timing }}
      />
    </>
  );
};
