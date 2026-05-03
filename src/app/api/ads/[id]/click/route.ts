import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Track ad click
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id: adId } = await params;

    if (!adId) {
      return NextResponse.json(
        { success: false, error: 'Missing ad ID' },
        { status: 400 }
      );
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Check if stats already exist for today
    const { data: existingStats } = await supabase
      .from('ad_stats')
      .select('*')
      .eq('ad_id', adId)
      .eq('date', today)
      .single();

    if (existingStats) {
      // Update existing stats
      const { error } = await supabase
        .from('ad_stats')
        .update({
          clicks: (existingStats.clicks || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);

      if (error) {
        console.error('Error updating ad click stats:', error);
      }
    } else {
      // Create new stats entry
      const { error } = await supabase
        .from('ad_stats')
        .insert({
          ad_id: adId,
          date: today,
          views: 0,
          impressions: 0,
          clicks: 1,
          revenue: 0
        });

      if (error) {
        console.error('Error creating ad click stats:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Ad click tracked'
    });

  } catch (error) {
    console.error('Error tracking ad click:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track ad click' },
      { status: 500 }
    );
  }
}