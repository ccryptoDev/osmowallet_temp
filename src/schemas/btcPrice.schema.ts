import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";

@Schema()
class HistoricBtcPrice {
    @Prop({required: true})
    price: number

    @Prop({required: true})
    date: Date
}



@Schema()
export class DailyHistoricBtcPrice extends HistoricBtcPrice{}
export const DailyHistoricBtcPriceSchema = SchemaFactory.createForClass(DailyHistoricBtcPrice);

@Schema()
export class HourlyHistoricBtcPrice extends HistoricBtcPrice{}
export const HourlyHistoricBtcPriceSchema = SchemaFactory.createForClass(HourlyHistoricBtcPrice);

@Schema()
export class EveryFiveMinutesHistoricBtcPrice extends HistoricBtcPrice{}
export const EveryFiveMinutesHistoricBtcPriceSchema = SchemaFactory.createForClass(EveryFiveMinutesHistoricBtcPrice);