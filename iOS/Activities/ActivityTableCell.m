//
//  ActivityTableCell.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityTableCell.h"
#import "GlobalColors.h"

@implementation ActivityTableCell

- (id)initWithCoder:(NSCoder *)aDecoder
{
    self = [super initWithCoder:aDecoder];
    if (self) {
        UIColor *linkBlue = [[GlobalColors sharedGlobal] linkBlue];
        [self.tapAlongButton setTitleColor:linkBlue forState:UIControlStateNormal];
        [self.tapAlongButton setTitleColor:linkBlue forState:UIControlStateHighlighted];
}
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];
}

-(void)refreshLayout
{
    [self.activityLabel sizeToFit];
    
    int padding = 8;
    int titleOffset = self.activityLabel.frame.size.height + self.activityLabel.frame.origin.y;
    
    CGRect oldFrame = self.divider.frame;
    [self.divider setFrame: CGRectMake(oldFrame.origin.x, titleOffset + padding, oldFrame.size.width, oldFrame.size.height)];
    oldFrame = self.tapAlongButton.frame;
    [self.tapAlongButton setFrame: CGRectMake(oldFrame.origin.x, titleOffset + 2*padding, oldFrame.size.width, oldFrame.size.height)];
    
    int buttonOffset = self.tapAlongButton.frame.size.height + self.tapAlongButton.frame.origin.y;
 
    oldFrame = self.cardBackgroundView.frame;
    [self.cardBackgroundView setFrame: CGRectMake(oldFrame.origin.x, oldFrame.origin.y, oldFrame.size.width, buttonOffset+padding - oldFrame.origin.y)];
    // TODO: Move me to the init and get me to work!
    UIImage *cardBackground = [[UIImage imageNamed:@"cardBackground.png"] resizableImageWithCapInsets:UIEdgeInsetsMake(2.0, 2.0, 3.0, 2.0)];
    self.cardBackgroundView.image = cardBackground;
    
}

@end
