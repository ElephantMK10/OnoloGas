import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { COMPANY } from '../../constants/company';
import Header from '../../components/Header';
import Button from '../../components/Button';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function MenuDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  // Find the matching menu item from COMPANY.customerInfo
  const menuItem = COMPANY.customerInfo.find(
    (item) => item.title.toLowerCase().replace(/\s+/g, '-') === slug,
  );

  // Fallback if page doesn't exist
  if (!menuItem) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <View style={styles.content}>
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.description}>Sorry, the page you're looking for doesn't exist.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Custom rich layout for About Us page
  if (menuItem.title === 'About Us') {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>About Us</Text>

          {/* Mission */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.description}>{COMPANY.slogan}</Text>
          </View>

          {/* Story */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Our Story</Text>
            {COMPANY.description.split('\n').map((p, idx) => (
              <Text key={idx} style={styles.description}>
                {p}
              </Text>
            ))}
            {menuItem.content.split('\n').map((p, idx) => (
              <Text key={`story-${idx}`} style={styles.description}>
                {p}
              </Text>
            ))}
          </View>

          {/* Why Choose Us */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Choose Us</Text>
            {COMPANY.benefits.map((benefit) => (
              <View key={benefit} style={styles.bulletPoint}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Button
            title="Contact Us"
            onPress={() => router.push('/contact')}
            style={{ marginTop: 16 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Custom rich layout for Safety Guidelines page
  if (menuItem.title === 'Safety Guidelines') {
    // Define sections manually to match desired layout
    const sections = [
      {
        title: 'Storage Safety',
        icon: 'alert-circle-outline',
        items: [
          'Always store gas bottles upright in a well-ventilated area',
          'Keep away from heat sources, direct sunlight, and electrical equipment',
          'Never store gas bottles in basements, below ground level, or near stairs',
          'Keep away from children and unauthorized persons',
        ],
      },
      {
        title: 'Usage Safety',
        icon: 'alert-circle-outline',
        items: [
          'Check for gas leaks using soapy water – bubbles indicate a leak',
          'Turn off the gas when not in use',
          'Ensure proper ventilation when using gas appliances',
          'Never use damaged equipment or bottles',
        ],
      },
      {
        title: 'Emergency Procedures',
        icon: 'information-circle-outline',
        items: [
          'Turn off the gas supply immediately',
          'Open all doors and windows to ventilate the area',
          'Do not operate electrical switches or create any source of ignition',
          'Evacuate the area and call emergency services: 10177',
        ],
      },
    ];

    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Gas Safety Tips</Text>

          {sections.map((section) => (
            <View key={section.title} style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name={section.icon as any} size={28} color={COLORS.primary} />
                <Text style={styles.cardTitle}>{section.title}</Text>
              </View>
              {section.items.map((line) => (
                <View key={line} style={styles.safetyItem}>
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={COLORS.primary}
                    style={styles.checkIcon}
                  />
                  <Text style={styles.safetyText}>{line}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* Remember banner */}
          <View style={styles.rememberCard}>
            <Text style={styles.rememberTitle}>Remember</Text>
            <Text style={styles.rememberText}>
              Regular maintenance of your gas equipment is essential for safety. Have your gas
              installations checked by a qualified technician at least once a year.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (menuItem.title === 'Safety Guidelines') {
    // Convert numbered safety lines into array
    const safetyLines = menuItem.content.split('\n').filter((l) => l.trim().length);
    // categorize? We'll just show in one card with check icons
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Gas Safety Tips</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="alert-circle-outline" size={28} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Safety Guidelines</Text>
            </View>
            {safetyLines.map((line) => (
              <View key={line} style={styles.safetyItem}>
                <Ionicons
                  name="checkmark-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.checkIcon}
                />
                <Text style={styles.safetyText}>{line.replace(/^\d+\.\s*/, '')}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Custom rich layout for Delivery page only
  if (menuItem.title === 'Delivery') {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Delivery Information</Text>

          {/* Delivery Areas */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="cube-outline" size={28} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Delivery Areas</Text>
            </View>
            <Text style={styles.description}>
              We currently deliver to all areas within Johannesburg and surrounding suburbs. Our
              service area includes:
            </Text>
            {['Sandton', 'Randburg', 'Midrand'].map((area) => (
              <View key={area} style={styles.bulletPointAligned}>
                <View style={styles.dotAligned} />
                <Text style={styles.bulletText}>{area} (and surrounding areas)</Text>
              </View>
            ))}
            <Text style={styles.description}>
              If you're unsure whether we deliver to your area, please contact our customer support.
            </Text>
          </View>

          {/* Delivery Times */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time-outline" size={28} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Delivery Times</Text>
            </View>
            <Text style={styles.description}>
              Standard delivery is within 48 hours of placing your order. Same-day delivery is
              available for orders placed before 10 AM in select areas.
            </Text>
            <Text style={styles.description}>
              Our delivery hours are from 7 AM to 8 PM, 7 days a week.
            </Text>
          </View>

          {/* Important Information */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="alert-circle-outline" size={28} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Important Information</Text>
            </View>
            {[
              'Someone must be present to receive the gas delivery',
              'We only provide refills - you must have your own gas bottle',
              'Our delivery personnel will inspect your gas bottle for safety before refilling',
              'Payment can be made via cash, card, or EFT upon delivery',
            ].map((info) => (
              <Text key={info} style={styles.description}>
                • {info}
              </Text>
            ))}
          </View>

          <Button
            title="Order Now"
            onPress={() => router.push('/order')}
            style={{ marginTop: 8 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Custom rich layout for Policy pages (Privacy Policy & Terms & Conditions)
  if (['Privacy Policy', 'Terms & Conditions'].includes(menuItem.title)) {
    const paragraphs = menuItem.content.split('\n');
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Text style={styles.title}>{menuItem.title}</Text>
          {paragraphs.map((p, idx) =>
            p.trim().length ? (
              <Text key={idx} style={styles.description}>
                • {p}
              </Text>
            ) : null,
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Default generic layout for other pages
  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{menuItem.title}</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            {menuItem.content.split('\n').map((paragraph, index) => (
              <Text key={index}>
                {paragraph}
                {index < menuItem.content.split('\n').length - 1 ? '\n\n' : ''}
              </Text>
            ))}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.white,
    marginLeft: 12,
  },
  description: {
    flex: 1,
    color: COLORS.text.gray,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 8,
    paddingLeft: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    flexShrink: 1,
    width: 0,
    fontSize: 16,
    color: COLORS.text.gray,
  },
  rememberCard: {
    backgroundColor: '#38221c',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  rememberTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  rememberText: {
    color: COLORS.text.gray,
    fontSize: 16,
    lineHeight: 24,
  },
  // Safety styles
  safetyItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  checkIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  safetyText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text.gray,
  },
  bulletPointAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    paddingLeft: 8,
  },
  dotAligned: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
});
